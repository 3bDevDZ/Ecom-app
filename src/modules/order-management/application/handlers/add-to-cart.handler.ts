import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { PRODUCT_REPOSITORY_TOKEN } from '../../../product-catalog/domain/repositories/repository.tokens';
import { IProductRepository } from '../../../product-catalog/domain/repositories/product.repository.interface';
import { Cart } from '../../domain/aggregates/cart';
import { CART_REPOSITORY_TOKEN } from '../../domain/repositories/repository.tokens';
import { ICartRepository } from '../../domain/repositories/icart-repository';
import { AddToCartCommand } from '../commands/add-to-cart.command';
import { CartDto } from '../dtos/cart.dto';

@CommandHandler(AddToCartCommand)
export class AddToCartCommandHandler
  implements ICommandHandler<AddToCartCommand>
{
  constructor(
    @Inject(CART_REPOSITORY_TOKEN)
    private readonly cartRepository: ICartRepository,
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository,
    private readonly eventBus: EventBus,
  ) { }

  async execute(command: AddToCartCommand): Promise<CartDto> {
    const { userId, productId, quantity, variantId } = command;

    // Fetch product details from Product Catalog
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Find or create cart for user
    let cart = await this.cartRepository.findActiveByUserId(userId);

    if (!cart) {
      cart = Cart.create(userId);
    }

    // Determine price and SKU (handle variants if needed)
    let unitPrice = product.basePrice.amount;
    let sku = product.sku.value;

    if (variantId && product.variants.length > 0) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (variant) {
        // Use the variant's calculatePrice method for proper price calculation
        const variantPrice = variant.calculatePrice(product.basePrice);
        unitPrice = variantPrice.amount;
        sku = variant.sku.value;
      }
    }

    // Add item to cart
    cart.addItem({
      productId,
      productName: product.name,
      sku,
      quantity,
      unitPrice,
      currency: product.basePrice.currency || 'USD',
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

