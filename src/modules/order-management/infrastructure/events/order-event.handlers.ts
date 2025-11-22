import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import {
  OrderPlaced,
  OrderCancelled,
  ItemAddedToCart,
  ItemRemovedFromCart,
  CartCleared,
} from '../../domain/events';
import { OrderEmailService } from '../email/order-email.service';
import { OutboxService } from '../../../../shared/infrastructure/outbox/outbox.service';

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
  ) {}

  async handle(event: OrderPlaced): Promise<void> {
    const {
 orderNumber, userId, totalAmount, itemCount } = event.payload;
    this.logger.log(`Order placed: ${orderNumber} by user ${userId}`);

    try {
      // 1. Send order confirmation email
      // Note: Email service would need order items and address - these should be added to payload if needed
      // await this.emailService.sendOrderConfirmation(...);

      // 2. Publish event to message queue via Outbox pattern
      await this.outboxService.insert(event);

      this.logger.log(`Order confirmation email sent for order ${orderNumber}`);
    } catch (error) {
      this.logger.error(`Failed to handle OrderPlaced event: ${error.message}`, error.stack);
      // Don't throw - we don't want to rollback the order placement
      // The outbox pattern will retry failed message deliveries
    }
  }
}

@Injectable()
@EventsHandler(OrderCancelled)
export class OrderCancelledHandler implements IEventHandler<OrderCancelled> {
  private readonly logger = new Logger(OrderCancelledHandler.name);

  constructor(
    private readonly emailService: OrderEmailService,
    private readonly outboxService: OutboxService,
  ) {}

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

