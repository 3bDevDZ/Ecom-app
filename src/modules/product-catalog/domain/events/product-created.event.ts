import { DomainEvent } from '../../../../shared/domain/domain-event.base';

/**
 * ProductCreated Domain Event
 *
 * Emitted when a new product is successfully created in the catalog.
 * This event can be used to:
 * - Notify other bounded contexts (e.g., Search Index)
 * - Trigger analytics tracking
 * - Send notifications to relevant stakeholders
 */
export class ProductCreatedEvent extends DomainEvent {
  readonly eventType = 'ProductCreated';

  constructor(
    aggregateId: string,
    public readonly sku: string,
    public readonly name: string,
    public readonly categoryId: string,
    public readonly brand: string,
    public readonly basePrice: number,
    public readonly currency: string,
  ) {
    super(aggregateId);
  }
}
