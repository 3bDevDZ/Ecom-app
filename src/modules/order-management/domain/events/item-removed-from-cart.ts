import { DomainEvent } from '../../../../shared/domain/domain-event.base';

export interface ItemRemovedFromCartPayload {
  cartId: string;
  userId: string;
  productId: string;
  quantity: number;
}

export class ItemRemovedFromCart extends DomainEvent {
  readonly eventType = 'ItemRemovedFromCart';

  constructor(
    aggregateId: string,
    readonly payload: ItemRemovedFromCartPayload,
  ) {
    super(aggregateId);
  }
}

