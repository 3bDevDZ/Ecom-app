import { DomainEvent } from '../../../../shared/domain/domain-event.base';

/**
 * InventoryReleased Domain Event
 *
 * Emitted when reserved inventory is released (e.g., order cancelled, payment failed).
 * This event can be used to:
 * - Update inventory read models
 * - Make inventory available for other orders
 * - Update analytics dashboards
 * - Coordinate with Order Management context
 */
export class InventoryReleasedEvent extends DomainEvent {
  readonly eventType = 'InventoryReleased';

  constructor(
    aggregateId: string,
    public readonly variantId: string,
    public readonly quantity: number,
    public readonly reason: string, // e.g., "Order cancelled", "Payment failed"
  ) {
    super(aggregateId);
  }
}
