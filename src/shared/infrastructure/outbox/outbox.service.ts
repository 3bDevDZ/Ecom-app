import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DomainEvent } from '@shared/domain';
import { EntityManager, Repository } from 'typeorm';
import { OutboxEntity } from './outbox.entity';

/**
 * Outbox Service
 *
 * Manages insertion of domain events into the outbox table.
 * Events are inserted within the same transaction as business operations
 * to ensure consistency.
 */
@Injectable()
export class OutboxService {
  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepository: Repository<OutboxEntity>,
  ) { }

  /**
   * Insert a domain event into the outbox
   * Should be called within the same transaction as the business operation
   */
  async insert(event: DomainEvent, manager?: EntityManager): Promise<void> {
    const repository = manager ? manager.getRepository(OutboxEntity) : this.outboxRepository;

    const outboxEntry = repository.create({
      eventType: event.eventType || event.constructor.name,
      aggregateId: event.aggregateId,
      aggregateType: this.extractAggregateType(event),
      payload: this.serializeEvent(event),
      processed: false,
      retryCount: 0,
      createdAt: new Date(),
    });

    await repository.save(outboxEntry);
  }

  /**
   * Insert multiple domain events into the outbox
   */
  async insertMany(events: DomainEvent[], manager?: EntityManager): Promise<void> {
    const repository = manager ? manager.getRepository(OutboxEntity) : this.outboxRepository;

    const outboxEntries = events.map((event) =>
      repository.create({
        eventType: event.eventType || event.constructor.name,
        aggregateId: event.aggregateId,
        aggregateType: this.extractAggregateType(event),
        payload: this.serializeEvent(event),
        processed: false,
        retryCount: 0,
        createdAt: new Date(),
      }),
    );

    await repository.save(outboxEntries);
  }

  /**
   * Get unprocessed events from the outbox
   */
  async getUnprocessedEvents(limit: number = 100): Promise<OutboxEntity[]> {
    return this.outboxRepository.find({
      where: { processed: false },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  /**
   * Mark an event as processed
   */
  async markAsProcessed(id: string, manager?: EntityManager): Promise<void> {
    const repository = manager ? manager.getRepository(OutboxEntity) : this.outboxRepository;

    await repository.update(id, {
      processed: true,
      processedAt: new Date(),
    });
  }

  /**
   * Mark an event as failed
   */
  async markAsFailed(id: string, error: string, manager?: EntityManager): Promise<void> {
    const repository = manager ? manager.getRepository(OutboxEntity) : this.outboxRepository;

    const outboxEntry = await repository.findOne({ where: { id } });

    if (outboxEntry) {
      await repository.update(id, {
        retryCount: outboxEntry.retryCount + 1,
        error,
      });
    }
  }

  /**
   * Serialize event to JSON-compatible format
   */
  private serializeEvent(event: DomainEvent): Record<string, any> {
    return {
      ...event,
      eventId: event.eventId,
      occurredOn: event.occurredOn.toISOString(),
      aggregateId: event.aggregateId,
    };
  }

  /**
   * Extract aggregate type from event metadata
   */
  private extractAggregateType(event: DomainEvent): string {
    // Try to extract from event name
    // Examples:
    // - "OrderPlaced" -> "Order"
    // - "ProductCreatedEvent" -> "Product"
    // - "CartConverted" -> "Cart"
    const eventName = event.constructor.name;

    // Pattern 1: OrderPlaced, CartConverted, etc. (Aggregate + Action)
    let match = eventName.match(/^(\w+?)(?:Placed|Converted|Cancelled|Created|Updated|Deleted)$/);
    if (match) {
      return match[1];
    }

    // Pattern 2: ProductCreatedEvent, etc. (Aggregate + Action + Event)
    match = eventName.match(/^(\w+?)(?:Created|Updated|Deleted)Event$/);
    if (match) {
      return match[1];
    }

    // Pattern 3: Generic event suffix
    match = eventName.match(/^(\w+?)Event$/);
    if (match) {
      return match[1];
    }

    // Fallback: try to extract first word (assumes CamelCase)
    match = eventName.match(/^([A-Z][a-z]+)/);
    return match ? match[1] : 'Unknown';
  }
}
