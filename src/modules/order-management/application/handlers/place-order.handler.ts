import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Order } from '../../domain/aggregates/order';
import { CART_REPOSITORY_TOKEN, ORDER_REPOSITORY_TOKEN } from '../../domain/repositories/repository.tokens';
import { ICartRepository } from '../../domain/repositories/icart-repository';
import { IOrderRepository } from '../../domain/repositories/iorder-repository';
import { Address } from '../../domain/value-objects/address';
import { PlaceOrderCommand } from '../commands/place-order.command';
import { OrderDto } from '../dtos/order.dto';

@CommandHandler(PlaceOrderCommand)
export class PlaceOrderCommandHandler
  implements ICommandHandler<PlaceOrderCommand, OrderDto>
{
  constructor(
    @Inject(CART_REPOSITORY_TOKEN)
    private readonly cartRepository: ICartRepository,
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: IOrderRepository,
  ) { }

  async execute(command: PlaceOrderCommand): Promise<OrderDto> {
    const { userId, shippingAddress } = command;

    // --- 1. Load data ---
    const cart = await this.cartRepository.findActiveByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    if (cart.isEmpty()) {
      throw new BadRequestException('Cannot place order from empty cart');
    }

    // --- 2. Domain logic ---
    const shipping = Address.create(shippingAddress);

    const order = Order.create({
      userId,
      cartId: cart.id,
      items: cart.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        currency: item.currency,
      })),
      shippingAddress: shipping,
      billingAddress: shipping,
    });

    // --- 3. Save via repository (transaction, event dispatch, and outbox are handled in base save()) ---
    // The save() method in BaseRepository:
    // - Starts a transaction
    // - Persists the entity
    // - Tracks the aggregate
    // - Collects domain events
    // - Dispatches events via EventBus (synchronously)
    // - Saves events to outbox
    // - Commits transaction
    await this.orderRepository.save(order);

    // Note: Cart conversion is handled by OrderPlacedCartConverterHandler
    // which listens to OrderPlaced domain event (separation of concerns)

    // --- 4. Convert to DTO ---
    return this.toDto(order);
  }

  private toDto(order: Order): OrderDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber.value,
      userId: order.userId,
      status: order.status.value,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        currency: item.currency,
        lineTotal: item.lineTotal,
      })),
      shippingAddress: {
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
        contactName: order.shippingAddress.contactName || '',
        contactPhone: order.shippingAddress.contactPhone || '',
      },
      billingAddress: {
        street: order.billingAddress.street,
        city: order.billingAddress.city,
        state: order.billingAddress.state,
        postalCode: order.billingAddress.postalCode,
        country: order.billingAddress.country,
        contactName: order.billingAddress.contactName || '',
        contactPhone: order.billingAddress.contactPhone || '',
      },
      totalAmount: order.totalAmount,
      itemCount: order.itemCount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
