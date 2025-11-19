import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  exchanges: {
    domainEvents: process.env.RABBITMQ_DOMAIN_EVENTS_EXCHANGE || 'domain.events',
    integrationEvents: process.env.RABBITMQ_INTEGRATION_EVENTS_EXCHANGE || 'integration.events',
    deadLetter: process.env.RABBITMQ_DEAD_LETTER_EXCHANGE || 'dead.letter',
  },
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
}));

