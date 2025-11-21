import { DomainEvent } from '../../../../shared/domain/domain-event.base';

/**
 * Base class for aggregate roots
 * Provides domain event management
 */
export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }
}

