import { getErrorDetails } from '@common/utils/error.util';
import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { DomainEvent } from '@shared/domain';
import { MessageBrokerService } from './message-broker.service';

/**
 * Event Publisher Service
 *
 * Publishes domain events to RabbitMQ.
 * Works in conjunction with the Outbox Pattern for reliable delivery.
 */
@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  constructor(
    private readonly messageBroker: MessageBrokerService,
    private readonly eventBus: EventBus,
  ) { }

  /**
   * Publish a domain event to RabbitMQ
   */
  async publishDomainEvent(event: DomainEvent): Promise<void> {
    try {
      const exchange = 'domain.events';
      const routingKey = this.createRoutingKey(event);

      await this.messageBroker.publish(exchange, routingKey, event, {
        persistent: true,
        timestamp: event.occurredOn.getTime(),
        messageId: event.eventId,
        type: event.constructor.name,
      });

      this.logger.debug(`Domain event published: ${event.constructor.name} (${event.eventId})`);
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error(
        `Failed to publish domain event: ${event.constructor.name}`,
        message,
        stack,
      );
      throw error;
    }
  }

  /**
   * Publish multiple domain events
   */
  async publishDomainEvents(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publishDomainEvent(event);
    }
  }

  /**
   * Publish an integration event to RabbitMQ
   */
  async publishIntegrationEvent(eventType: string, payload: any): Promise<void> {
    try {
      const exchange = 'integration.events';
      const routingKey = eventType.toLowerCase();

      await this.messageBroker.publish(exchange, routingKey, payload, {
        persistent: true,
        timestamp: Date.now(),
        type: eventType,
      });

      this.logger.debug(`Integration event published: ${eventType}`);
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error(`Failed to publish integration event: ${eventType}`, message, stack);
      throw error;
    }
  }

  /**
   * Publish event to local event bus (for internal handlers)
   */
  async publishToLocalBus(event: DomainEvent): Promise<void> {
    try {
      await this.eventBus.publish(event);
      this.logger.debug(`Event published to local bus: ${event.constructor.name}`);
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error(
        `Failed to publish to local bus: ${event.constructor.name}`,
        message,
        stack,
      );
      throw error;
    }
  }

  /**
   * Create routing key from domain event
   * Format: {aggregateType}.{eventType}
   * Example: order.OrderCreatedEvent
   */
  private createRoutingKey(event: DomainEvent): string {
    const eventType = event.constructor.name;
    const aggregateType = this.extractAggregateType(eventType);
    return `${aggregateType}.${eventType}`;
  }

  /**
   * Extract aggregate type from event name
   * Example: "OrderCreatedEvent" -> "order"
   */
  private extractAggregateType(eventType: string): string {
    const match = eventType.match(/^(\w+?)(?:Created|Updated|Deleted|Event)/);
    return match ? match[1].toLowerCase() : 'unknown';
  }
}
