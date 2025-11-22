import { DomainEvent } from '../../../../shared/domain/domain-event.base';

export interface CartClearedPayload {
  cartId: string;
  userId: string;
}

export class CartCleared extends DomainEvent {
  readonly eventType = 'CartCleared';

  constructor(
    aggregateId: string,
    readonly payload: CartClearedPayload,
  ) {
    super(aggregateId);
  }
}

