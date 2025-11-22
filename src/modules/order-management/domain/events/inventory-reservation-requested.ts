import { DomainEvent } from '../../../../shared/domain/domain-event.base';

export interface InventoryReservationRequestedPayload {
  orderId: string;
  orderNumber: string;
  items: Array<{
    productId: string;
    sku: string;
    quantity: number;
  }>;
}

export class InventoryReservationRequested extends DomainEvent {
  readonly eventType = 'InventoryReservationRequested';

  constructor(
    aggregateId: string,
    readonly payload: InventoryReservationRequestedPayload,
  ) {
    super(aggregateId);
  }
}

