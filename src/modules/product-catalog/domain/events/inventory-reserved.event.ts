import { DomainEvent } from '../../../../shared/domain/domain-event.base';

/**
 * InventoryReserved Domain Event
 *
 * Emitted when inventory is successfully reserved for an order.
 * This event can be used to:
 * - Update inventory read models
 * - Trigger low-stock notifications
 * - Update analytics dashboards
 * - Coordinate with Order Management context
 */
export class InventoryReservedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly variantId: string,
    public readonly quantity: number,
    public readonly reservedFor: string, // Order ID or customer ID
  ) {
    super(aggregateId);
  }
}
