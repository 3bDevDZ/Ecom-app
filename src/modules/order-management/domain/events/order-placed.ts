import { DomainEvent } from '../../../../shared/domain/domain-event.base';

export interface OrderPlacedPayload {
  orderId: string;
  orderNumber: string;
  userId: string;
  cartId: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
}

export class OrderPlaced extends DomainEvent {
  readonly eventType = 'OrderPlaced';

  constructor(
    aggregateId: string,
    readonly payload: OrderPlacedPayload,
  ) {
    super(aggregateId);
  }
}

