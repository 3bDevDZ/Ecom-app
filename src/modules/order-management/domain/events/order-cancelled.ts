import { DomainEvent } from '../../../../shared/domain/domain-event.base';

export interface OrderCancelledPayload {
  orderId: string;
  orderNumber: string;
  userId: string;
  reason: string;
}

export class OrderCancelled extends DomainEvent {
  readonly eventType = 'OrderCancelled';

  constructor(
    aggregateId: string,
    readonly payload: OrderCancelledPayload,
  ) {
    super(aggregateId);
  }
}

