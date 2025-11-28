import { registerAs } from '@nestjs/config';

/**
 * RabbitMQ Configuration
 *
 * Defines routing keys and queue names for domain events.
 * This configuration maps event types to their routing keys and target queues.
 */
export default registerAs('rabbitmq', () => {
  // Default routing keys mapping: EventType -> RoutingKey
  // Format: "EventType" -> "aggregate.action.event" (dot notation)
  const defaultRoutingKeys: Record<string, string> = {
    // Order Management Events
    OrderPlaced: process.env.RABBITMQ_ROUTING_KEY_ORDER_PLACED || 'order.placed.event',
    OrderCancelled: process.env.RABBITMQ_ROUTING_KEY_ORDER_CANCELLED || 'order.cancelled.event',
    CartCleared: process.env.RABBITMQ_ROUTING_KEY_CART_CLEARED || 'cart.cleared.event',
    ItemAddedToCart: process.env.RABBITMQ_ROUTING_KEY_ITEM_ADDED_TO_CART || 'item.added.to.cart.event',
    ItemRemovedFromCart: process.env.RABBITMQ_ROUTING_KEY_ITEM_REMOVED_FROM_CART || 'item.removed.from.cart.event',
    InventoryReservationRequested: process.env.RABBITMQ_ROUTING_KEY_INVENTORY_RESERVATION_REQUESTED || 'inventory.reservation.requested.event',

    // Product Catalog Events
    ProductCreated: process.env.RABBITMQ_ROUTING_KEY_PRODUCT_CREATED || 'product.created.event',
    ProductUpdated: process.env.RABBITMQ_ROUTING_KEY_PRODUCT_UPDATED || 'product.updated.event',
    InventoryReserved: process.env.RABBITMQ_ROUTING_KEY_INVENTORY_RESERVED || 'inventory.reserved.event',
    InventoryReleased: process.env.RABBITMQ_ROUTING_KEY_INVENTORY_RELEASED || 'inventory.released.event',
  };

  // Default queue names mapping: EventType -> QueueName
  const defaultQueueNames: Record<string, string> = {
    // Order Management Events -> Order Events Queue
    OrderPlaced: process.env.RABBITMQ_QUEUE_ORDER_PLACED || 'order.events',
    OrderCancelled: process.env.RABBITMQ_QUEUE_ORDER_CANCELLED || 'order.events',
    CartCleared: process.env.RABBITMQ_QUEUE_CART_CLEARED || 'order.events',
    ItemAddedToCart: process.env.RABBITMQ_QUEUE_ITEM_ADDED_TO_CART || 'order.events',
    ItemRemovedFromCart: process.env.RABBITMQ_QUEUE_ITEM_REMOVED_FROM_CART || 'order.events',
    InventoryReservationRequested: process.env.RABBITMQ_QUEUE_INVENTORY_RESERVATION_REQUESTED || 'order.events',

    // Product Catalog Events -> Inventory Events Queue
    ProductCreated: process.env.RABBITMQ_QUEUE_PRODUCT_CREATED || 'inventory.events',
    ProductUpdated: process.env.RABBITMQ_QUEUE_PRODUCT_UPDATED || 'inventory.events',
    InventoryReserved: process.env.RABBITMQ_QUEUE_INVENTORY_RESERVED || 'inventory.events',
    InventoryReleased: process.env.RABBITMQ_QUEUE_INVENTORY_RELEASED || 'inventory.events',
  };

  return {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    exchangeName: process.env.RABBITMQ_EXCHANGE_NAME || 'domain.events',
    routingKeys: defaultRoutingKeys,
    queueNames: defaultQueueNames,
    queues: {
      orderEvents: process.env.RABBITMQ_ORDER_EVENTS_QUEUE || 'order.events',
      inventoryEvents: process.env.RABBITMQ_INVENTORY_EVENTS_QUEUE || 'inventory.events',
      notificationEvents: process.env.RABBITMQ_NOTIFICATION_EVENTS_QUEUE || 'notification.events',
      deadLetter: process.env.RABBITMQ_DEAD_LETTER_QUEUE || 'dead.letter.queue',
    },
    retryAttempts: parseInt(process.env.RABBITMQ_RETRY_ATTEMPTS || '5', 10),
    retryDelay: parseInt(process.env.RABBITMQ_RETRY_DELAY || '5000', 10),
    messageTtl: parseInt(process.env.RABBITMQ_MESSAGE_TTL || '604800000', 10), // 7 days
    prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH_COUNT || '10', 10),
  };
});

