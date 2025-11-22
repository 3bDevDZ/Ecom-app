import { DomainEvent } from '../../../../shared/domain/domain-event.base';

export interface ItemAddedToCartPayload {
  cartId: string;
  userId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export class ItemAddedToCart extends DomainEvent {
  readonly eventType = 'ItemAddedToCart';

  constructor(
    aggregateId: string,
    readonly payload: ItemAddedToCartPayload,
  ) {
    super(aggregateId);
  }
}

