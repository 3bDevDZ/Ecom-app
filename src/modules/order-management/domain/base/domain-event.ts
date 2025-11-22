/**
 * Base interface for all domain events
 */
export interface DomainEvent {
  eventType: string;
  aggregateId: string;
  occurredAt: Date;
  payload: any;
}

