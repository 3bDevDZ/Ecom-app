import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OutboxService } from '../../../../shared/infrastructure/outbox/outbox.service';
import {
  CartCleared,
  ItemAddedToCart,
  ItemRemovedFromCart,
  OrderCancelled,
  OrderPlaced,
} from '../../domain/events';
import { IOrderRepository } from '../../domain/repositories/iorder-repository';
import { OrderEmailService } from '../email/order-email.service';
import { OrderEntity } from '../persistence/entities/order.entity';
import { ReceiptService } from '../services/receipt.service';

/**
 * Order Event Handlers (T162)
 *
 * Handles domain events from the Order Management bounded context.
 * Responsibilities:
 * - Send confirmation emails
 * - Publish events to message queue via Outbox pattern
 * - Log important domain events
 * - Trigger external integrations
 */

@Injectable()
@EventsHandler(OrderPlaced)
export class OrderPlacedHandler implements IEventHandler<OrderPlaced> {
  private readonly logger = new Logger(OrderPlacedHandler.name);

  constructor(
    private readonly emailService: OrderEmailService,
    private readonly outboxService: OutboxService,
    private readonly receiptService: ReceiptService,
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) { }

  async handle(event: OrderPlaced): Promise<void> {
    const { orderId, orderNumber, userId, totalAmount, itemCount } = event.payload;
    this.logger.log(`Order placed: ${orderNumber} by user ${userId}`);

    try {
      // 1. Generate receipt and update order entity
      try {
        const order = await this.orderRepository.findById(orderId);
        if (order) {
          const orderDto = this.orderToDto(order);
          const receiptUrl = await this.receiptService.generateReceipt(orderDto);

          // Update order entity with receipt URL
          await this.dataSource.getRepository(OrderEntity).update(orderId, {
            receiptUrl,
          });

          this.logger.log(`Receipt generated for order ${orderNumber}: ${receiptUrl}`);
        }
      } catch (receiptError) {
        this.logger.error(`Failed to generate receipt for order ${orderNumber}: ${receiptError.message}`, receiptError.stack);
        // Continue - receipt generation failure shouldn't block order processing
      }

      // 2. Send order confirmation email
      // Note: Email service would need order items and address - these should be added to payload if needed
      // await this.emailService.sendOrderConfirmation(...);

      // 3. Publish event to message queue via Outbox pattern
      await this.outboxService.insert(event);

      this.logger.log(`Order confirmation email sent for order ${orderNumber}`);
    } catch (error) {
      this.logger.error(`Failed to handle OrderPlaced event: ${error.message}`, error.stack);
      // Don't throw - we don't want to rollback the order placement
      // The outbox pattern will retry failed message deliveries
    }
  }

  /**
   * Convert Order domain entity to OrderDto for receipt generation
   */
  private orderToDto(order: any): any {
    return {
      id: order.id,
      orderNumber: order.orderNumber.value,
      userId: order.userId,
      status: order.status.value,
      items: order.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        currency: item.currency,
        lineTotal: item.lineTotal,
      })),
      totalAmount: order.totalAmount,
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
      createdAt: order.createdAt,
    };
  }
}

@Injectable()
@EventsHandler(OrderCancelled)
export class OrderCancelledHandler implements IEventHandler<OrderCancelled> {
  private readonly logger = new Logger(OrderCancelledHandler.name);

  constructor(
    private readonly emailService: OrderEmailService,
    private readonly outboxService: OutboxService,
  ) { }

  async handle(event: OrderCancelled): Promise<void> {
    const { orderNumber, userId, reason } = event.payload;
    this.logger.log(`Order cancelled: ${orderNumber} - Reason: ${reason}`);

    try {
      // 1. Send cancellation notification email
      await this.emailService.sendOrderCancellation(userId, orderNumber, reason);

      // 2. Publish event to message queue for inventory release
      await this.outboxService.insert(event);

      this.logger.log(`Order cancellation email sent for order ${orderNumber}`);
    } catch (error) {
      this.logger.error(`Failed to handle OrderCancelled event: ${error.message}`, error.stack);
    }
  }
}

@Injectable()
@EventsHandler(ItemAddedToCart)
export class ItemAddedToCartHandler implements IEventHandler<ItemAddedToCart> {
  private readonly logger = new Logger(ItemAddedToCartHandler.name);

  async handle(event: ItemAddedToCart): Promise<void> {
    const { productId, quantity, userId } = event.payload;
    this.logger.debug(
      `Item added to cart: ${productId} (qty: ${quantity}) - User: ${userId}`,
    );

    // Optional: Track cart analytics
    // Optional: Send reminder emails for abandoned carts (after some time)
  }
}

@Injectable()
@EventsHandler(ItemRemovedFromCart)
export class ItemRemovedFromCartHandler implements IEventHandler<ItemRemovedFromCart> {
  private readonly logger = new Logger(ItemRemovedFromCartHandler.name);

  async handle(event: ItemRemovedFromCart): Promise<void> {
    const { productId, userId } = event.payload;
    this.logger.debug(`Item removed from cart: ${productId} - User: ${userId}`);

    // Optional: Track cart analytics
  }
}

@Injectable()
@EventsHandler(CartCleared)
export class CartClearedHandler implements IEventHandler<CartCleared> {
  private readonly logger = new Logger(CartClearedHandler.name);

  async handle(event: CartCleared): Promise<void> {
    const { cartId, userId } = event.payload;
    this.logger.debug(`Cart cleared: ${cartId} - User: ${userId}`);

    // Optional: Track cart analytics
  }
}

// Export all handlers for module registration
export const OrderEventHandlers = [
  OrderPlacedHandler,
  OrderCancelledHandler,
  ItemAddedToCartHandler,
  ItemRemovedFromCartHandler,
  CartClearedHandler,
];

