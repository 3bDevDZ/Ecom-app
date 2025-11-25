import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { GetProductByIdQuery } from '../../../product-catalog/application/queries/get-product-by-id.query';
import { GetCartQuery } from '../queries/get-cart.query';
import { Cart } from '../../domain/aggregates/cart';
import { ICartRepository } from '../../domain/repositories/icart-repository';
import { AddToCartCommand } from '../commands/add-to-cart.command';
import { CartDto } from '../dtos/cart.dto';

@CommandHandler(AddToCartCommand)
export class AddToCartCommandHandler
  implements ICommandHandler<AddToCartCommand>
{
  constructor(
    @Inject('ICartRepository')
    private readonly cartRepository: ICartRepository,
    private readonly eventBus: EventBus,
    private readonly queryBus: QueryBus,
  ) { }

  async execute(command: AddToCartCommand): Promise<CartDto> {
    const { userId, productId, quantity, variantId } = command;

    // Fetch product details from Product Catalog
    const product = await this.queryBus.execute(new GetProductByIdQuery(productId));
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Find or create cart for user
    let cart = await this.cartRepository.findActiveByUserId(userId);

    if (!cart) {
      cart = Cart.create(userId);
    }

    // Determine price and SKU (handle variants if needed)
    let unitPrice = product.basePrice;
    let sku = product.sku;

    if (variantId && product.variants) {
      const variant = product.variants.find((v: any) => v.id === variantId);
      if (variant) {
        unitPrice = variant.priceDelta ? product.basePrice + variant.priceDelta : product.basePrice;
        sku = variant.sku;
      }
    }

    // Add item to cart
    cart.addItem({
      productId,
      productName: product.name,
      sku,
      quantity,
      unitPrice,
      currency: product.currency || 'USD',
    });

    // Save cart
    await this.cartRepository.save(cart);

    // Publish domain events
    const events = cart.getDomainEvents();
    events.forEach(event => this.eventBus.publish(event));
    cart.clearDomainEvents();

    // Return updated cart as DTO
    const updatedCart = await this.cartRepository.findActiveByUserId(userId);
    if (!updatedCart) {
      throw new Error('Cart not found after adding item');
    }

    // Map to DTO
    const cartDto = new CartDto();
    cartDto.id = updatedCart.id;
    cartDto.userId = updatedCart.userId;
    cartDto.status = updatedCart.status.value;
    cartDto.items = updatedCart.items.map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      currency: item.currency,
      lineTotal: item.lineTotal,
    }));
    cartDto.totalAmount = updatedCart.totalAmount;
    cartDto.itemCount = updatedCart.itemCount;
    cartDto.createdAt = updatedCart.createdAt;
    cartDto.updatedAt = updatedCart.updatedAt;

    return cartDto;
  }
}

