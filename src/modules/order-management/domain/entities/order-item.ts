import { v4 as uuidv4 } from 'uuid';

export interface OrderItemProps {
  id?: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

/**
 * OrderItem Entity
 *
 * Represents an item in an order (immutable after creation)
 */
export class OrderItem {
  private readonly _id: string;
  private readonly _productId: string;
  private readonly _productName: string;
  private readonly _sku: string;
  private readonly _quantity: number;
  private readonly _unitPrice: number;
  private readonly _currency: string;

  private constructor(props: Required<OrderItemProps>) {
    this._id = props.id;
    this._productId = props.productId;
    this._productName = props.productName;
    this._sku = props.sku;
    this._quantity = props.quantity;
    this._unitPrice = props.unitPrice;
    this._currency = props.currency;
  }

  static create(props: OrderItemProps): OrderItem {
    this.validate(props);

    return new OrderItem({
      id: props.id || uuidv4(),
      productId: props.productId,
      productName: props.productName,
      sku: props.sku,
      quantity: props.quantity,
      unitPrice: props.unitPrice,
      currency: props.currency,
    });
  }

  static reconstitute(props: Required<OrderItemProps>): OrderItem {
    return new OrderItem(props);
  }

  private static validate(props: OrderItemProps): void {
    if (props.quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    if (props.unitPrice < 0) {
      throw new Error('Unit price must be non-negative');
    }
  }

  get id(): string {
    return this._id;
  }

  get productId(): string {
    return this._productId;
  }

  get productName(): string {
    return this._productName;
  }

  get sku(): string {
    return this._sku;
  }

  get quantity(): number {
    return this._quantity;
  }

  get unitPrice(): number {
    return this._unitPrice;
  }

  get currency(): string {
    return this._currency;
  }

  get lineTotal(): number {
    return this._quantity * this._unitPrice;
  }

  equals(other: OrderItem): boolean {
    if (!other) {
      return false;
    }
    return this._id === other._id;
  }
}

