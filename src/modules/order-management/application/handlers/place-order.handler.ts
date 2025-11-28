import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWorkService } from '@shared/infrastructure/uow/unit-of-work.service';
import { Order } from '../../domain/aggregates/order';
import { ICartRepository } from '../../domain/repositories/icart-repository';
import { IOrderRepository } from '../../domain/repositories/iorder-repository';
import { Address } from '../../domain/value-objects/address';
import { PlaceOrderCommand } from '../commands/place-order.command';

@CommandHandler(PlaceOrderCommand)
export class PlaceOrderCommandHandler
  implements ICommandHandler<PlaceOrderCommand, string>
{
  constructor(
    @Inject('ICartRepository')
    private readonly cartRepository: ICartRepository,
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    private readonly unitOfWork: UnitOfWorkService,
  ) { }

  async execute(command: PlaceOrderCommand): Promise<string> {
    const { userId, shippingAddress } = command;

    return await this.unitOfWork.execute(async (manager) => {
      // Find active cart for user
      const cart = await this.cartRepository.findActiveByUserId(userId, manager);
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      if (cart.isEmpty()) {
        throw new BadRequestException('Cannot place order from empty cart');
      }

      // Create shipping address
      const shipping = Address.create(shippingAddress);

      // Create order from cart
      // This adds domain events: OrderPlaced, InventoryReservationRequested
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

      // Save order (events are automatically collected by repository)
      await this.orderRepository.save(order, manager);

      // Convert cart (mark as converted)
      // This may add domain events (e.g., CartConverted)
      cart.convert();
      await this.cartRepository.save(cart, manager);

      // All domain events from both order and cart are:
      // 1. Collected by repositories
      // 2. Added to UnitOfWorkContext
      // 3. Saved to outbox table (same transaction)
      // 4. Published later by OutboxProcessor to RabbitMQ

      // Return order number for redirect
      return order.orderNumber.value;
    });
  }
}

