import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { GetProductByIdQuery } from '../../../product-catalog/application/queries/get-product-by-id.query';
import { Cart } from '../../domain/aggregates/cart';
import { ICartRepository } from '../../domain/repositories/icart-repository';
import { AddToCartCommand } from '../commands/add-to-cart.command';

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

  async execute(command: AddToCartCommand): Promise<void> {
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
  }
}

