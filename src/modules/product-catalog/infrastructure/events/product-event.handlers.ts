import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import {
  ProductCreatedEvent,
  ProductUpdatedEvent,
  InventoryReservedEvent,
  InventoryReleasedEvent,
} from '../../domain/events';

/**
 * ProductCreatedEventHandler
 *
 * Handles ProductCreated domain event.
 * Updates read models, triggers analytics, sends notifications, etc.
 */
@EventsHandler(ProductCreatedEvent)
@Injectable()
export class ProductCreatedEventHandler implements IEventHandler<ProductCreatedEvent> {
  private readonly logger = new Logger(ProductCreatedEventHandler.name);

  async handle(event: ProductCreatedEvent): Promise<void> {
    this.logger.log(`Product created: ${event.aggregateId} - ${event.name}`);

    // TODO: In future iterations:
    // - Update search index (e.g., Elasticsearch)
    // - Send notification to product managers
    // - Trigger analytics event
    // - Update cache if needed

    // For MVP, read model is updated via database view
    // No additional action needed here
  }
}

/**
 * ProductUpdatedEventHandler
 *
 * Handles ProductUpdated domain event.
 * Invalidates caches, updates read models, etc.
 */
@EventsHandler(ProductUpdatedEvent)
@Injectable()
export class ProductUpdatedEventHandler implements IEventHandler<ProductUpdatedEvent> {
  private readonly logger = new Logger(ProductUpdatedEventHandler.name);

  async handle(event: ProductUpdatedEvent): Promise<void> {
    this.logger.log(`Product updated: ${event.aggregateId}`);

    // TODO: In future iterations:
    // - Invalidate cache for this product
    // - Update search index
    // - Trigger audit log
    // - Send notification if significant changes (e.g., price change)

    // For MVP, read model is updated via database view
    // No additional action needed here
  }
}

/**
 * InventoryReservedEventHandler
 *
 * Handles InventoryReserved domain event.
 * Updates inventory tracking, triggers low-stock alerts.
 */
@EventsHandler(InventoryReservedEvent)
@Injectable()
export class InventoryReservedEventHandler implements IEventHandler<InventoryReservedEvent> {
  private readonly logger = new Logger(InventoryReservedEventHandler.name);

  async handle(event: InventoryReservedEvent): Promise<void> {
    this.logger.log(
      `Inventory reserved: Product ${event.aggregateId}, Variant ${event.variantId}, Quantity ${event.quantity}`,
    );

    // TODO: In future iterations:
    // - Check if low stock threshold reached
    // - Send low-stock notification
    // - Update analytics dashboard
    // - Publish to message queue for other bounded contexts

    // For MVP, inventory is updated in the domain entity
    // No additional action needed here
  }
}

/**
 * InventoryReleasedEventHandler
 *
 * Handles InventoryReleased domain event.
 * Updates inventory tracking, makes inventory available again.
 */
@EventsHandler(InventoryReleasedEvent)
@Injectable()
export class InventoryReleasedEventHandler implements IEventHandler<InventoryReleasedEvent> {
  private readonly logger = new Logger(InventoryReleasedEventHandler.name);

  async handle(event: InventoryReleasedEvent): Promise<void> {
    this.logger.log(
      `Inventory released: Product ${event.aggregateId}, Variant ${event.variantId}, Quantity ${event.quantity}, Reason: ${event.reason}`,
    );

    // TODO: In future iterations:
    // - Update inventory availability dashboard
    // - Trigger analytics event
    // - Publish to message queue for other bounded contexts

    // For MVP, inventory is updated in the domain entity
    // No additional action needed here
  }
}
