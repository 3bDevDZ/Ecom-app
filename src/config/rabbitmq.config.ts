import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  exchanges: {
    domainEvents: process.env.RABBITMQ_DOMAIN_EVENTS_EXCHANGE || 'domain.events',
    integrationEvents: process.env.RABBITMQ_INTEGRATION_EVENTS_EXCHANGE || 'integration.events',
    deadLetter: process.env.RABBITMQ_DEAD_LETTER_EXCHANGE || 'dead.letter',
  },
  queues: {
    b2bEcommerceQueue: process.env.RABBITMQ_QUEUE || 'b2b.ecommerce.queue',
    deadLetter: process.env.RABBITMQ_DEAD_LETTER_QUEUE || 'dead.letter.queue',
  },
  retryAttempts: parseInt(process.env.RABBITMQ_RETRY_ATTEMPTS || '5', 10),
  retryDelay: parseInt(process.env.RABBITMQ_RETRY_DELAY || '5000', 10),
  messageTtl: parseInt(process.env.RABBITMQ_MESSAGE_TTL || '604800000', 10), // 7 days
  prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH_COUNT || '10', 10),
}));

// config/rabbitmq.event-mapping.ts
export const EVENT_QUEUE_MAPPING = {
  CartCreatedEvent: process.env.RABBITMQ_QUEUE || 'b2b.ecommerce.queue',
  CartUpdatedEvent: process.env.RABBITMQ_QUEUE || 'b2b.ecommerce.queue',
  CartDeletedEvent: process.env.RABBITMQ_QUEUE || 'b2b.ecommerce.queue',
  CartItemAddedEvent: process.env.RABBITMQ_QUEUE || 'b2b.ecommerce.queue',
  CartItemRemovedEvent: process.env.RABBITMQ_QUEUE || 'b2b.ecommerce.queue',
  CartItemQuantityUpdatedEvent: process.env.RABBITMQ_QUEUE || 'b2b.ecommerce.queue',
  CartItemQuantityDecreasedEvent: process.env.RABBITMQ_QUEUE || 'b2b.ecommerce.queue',
  CartItemQuantityIncreasedEvent: process.env.RABBITMQ_QUEUE || 'b2b.ecommerce.queue',
  CartItemQuantitySetEvent: process.env.RABBITMQ_QUEUE || 'b2b.ecommerce.queue',
  CartItemQuantityResetEvent: process.env.RABBITMQ_QUEUE || 'b2b.ecommerce.queue',
  CartItemQuantityClearedEvent: process.env.RABBITMQ_QUEUE || 'b2b.ecommerce.queue',
  OrderPlaced: process.env.RABBITMQ_QUEUE || 'b2b.ecommerce.queue',
  InventoryReservationRequested: process.env.RABBITMQ_QUEUE || 'b2b.ecommerce.queue',
  InventoryReserved: process.env.RABBITMQ_QUEUE || 'b2b.ecommerce.queue',
  InventoryReleased: process.env.RABBITMQ_QUEUE || 'b2b.ecommerce.queue',
} as const;

// Type-safe helpers
export type DomainEventName = keyof typeof EVENT_QUEUE_MAPPING;
export type QueueName = typeof EVENT_QUEUE_MAPPING[DomainEventName];

export function getQueueForEvent(eventName: string): string {
  const queue = EVENT_QUEUE_MAPPING[eventName as DomainEventName];
  if (!queue) {
    throw new Error(`No queue configured for event: ${eventName}`);
  }
  return queue;
}
