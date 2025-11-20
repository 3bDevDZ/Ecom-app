import { IEvent } from '@nestjs/cqrs';
import { v4 as uuid } from 'uuid';

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

  constructor(aggregateId: string) {
    this.eventId = uuid();
    this.occurredOn = new Date();
    this.aggregateId = aggregateId;
  }
}

