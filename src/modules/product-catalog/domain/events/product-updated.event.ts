import { DomainEvent } from '../../../../shared/domain/domain-event.base';

/**
 * ProductUpdated Domain Event
 *
 * Emitted when product details are updated.
 * This event can be used to:
 * - Update search indexes
 * - Invalidate caches
 * - Trigger audit logs
 * - Notify subscribers of product changes
 */
export class ProductUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly updatedFields: {
      name?: string;
      description?: string;
      categoryId?: string;
      brand?: string;
      basePrice?: number;
      currency?: string;
      isActive?: boolean;
    },
  ) {
    super(aggregateId);
  }
}
