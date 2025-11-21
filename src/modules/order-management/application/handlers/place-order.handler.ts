import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PlaceOrderCommand } from '../commands/place-order.command';
import { ICartRepository } from '../../domain/repositories/icart-repository';
import { IOrderRepository } from '../../domain/repositories/iorder-repository';
import { Order } from '../../domain/aggregates/order';
import { Address } from '../../domain/value-objects/address';

@CommandHandler(PlaceOrderCommand)
export class PlaceOrderCommandHandler
  implements ICommandHandler<PlaceOrderCommand, string>
{
  constructor(
    @Inject('ICartRepository')
    private readonly cartRepository: ICartRepository,
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: PlaceOrderCommand): Promise<string> {
    const { userId, shippingAddress } = command;

    // Find active cart for user
    const cart = await this.cartRepository.findActiveByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    if (cart.isEmpty()) {
      throw new BadRequestException('Cannot place order from empty cart');
    }

    // Create shipping address
    const shipping = Address.create(shippingAddress);

    // Create order from cart
    const order = Order.create({
      userId,
      cartId: cart.id,
      items: cart.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        currency: item.currency,
      })),
      shippingAddress: shipping,
      billingAddress: shipping, // Use same address for billing for now
    });

    // Save order
    await this.orderRepository.save(order);

    // Convert cart (mark as converted)
    cart.convert();
    await this.cartRepository.save(cart);

    // Publish domain events from order
    const orderEvents = order.getDomainEvents();
    orderEvents.forEach(event => this.eventBus.publish(event));
    order.clearDomainEvents();

    // Publish domain events from cart
    const cartEvents = cart.getDomainEvents();
    cartEvents.forEach(event => this.eventBus.publish(event));
    cart.clearDomainEvents();

    return order.id;
  }
}

