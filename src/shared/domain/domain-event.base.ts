import { IEvent } from '@nestjs/cqrs';
import { v4 as uuid } from 'uuid';
import { getQueueForEvent } from '../../config/rabbitmq.config';

/**
 * Base class for all Domain Events
 *
 * Domain events represent something that happened in the domain
 * that domain experts care about.
 */
export abstract class DomainEvent implements IEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly aggregateId: string;
  public readonly eventType: string;

  constructor(aggregateId: string) {
    this.eventId = uuid();
    this.occurredOn = new Date();
    this.aggregateId = aggregateId;
    // eventType is set by subclass property initializers (e.g., readonly eventType = 'EventName')
    // If not set, it will be undefined and services will fall back to constructor.name
    // We don't set it here to allow subclasses to override it
  }
}

export function getEventQueue(event: DomainEvent): string {
  return getQueueForEvent(event.eventType);
}

