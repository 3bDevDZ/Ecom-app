import { Money } from '../value-objects/money';

/**
 * Order Item Entity
 * Represents a single product in an order
 */
export interface OrderItemProps {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: Money;
  variant?: Record<string, string>; // e.g., { size: 'L', color: 'Blue' }
}

export class OrderItem {
  private constructor(private readonly props: OrderItemProps) {
    this.validate();
  }

  static create(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }

  getId(): string {
    return this.props.id;
  }

  getProductId(): string {
    return this.props.productId;
  }

  getProductName(): string {
    return this.props.productName;
  }

  getProductImage(): string {
    return this.props.productImage;
  }

  getQuantity(): number {
    return this.props.quantity;
  }

  getUnitPrice(): Money {
    return this.props.unitPrice;
  }

  getVariant(): Record<string, string> | undefined {
    return this.props.variant;
  }

  getSubtotal(): Money {
    return this.props.unitPrice.multiply(this.props.quantity);
  }

  toJSON() {
    return {
      id: this.props.id,
      productId: this.props.productId,
      productName: this.props.productName,
      productImage: this.props.productImage,
      quantity: this.props.quantity,
      unitPrice: {
        amount: this.props.unitPrice.getAmount(),
        currency: this.props.unitPrice.getCurrency(),
      },
      variant: this.props.variant,
      subtotal: {
        amount: this.getSubtotal().getAmount(),
        currency: this.getSubtotal().getCurrency(),
      },
    };
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error('Order item ID is required');
    }
    if (!this.props.productId) {
      throw new Error('Product ID is required');
    }
    if (!this.props.productName) {
      throw new Error('Product name is required');
    }
    if (this.props.quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }
  }
}
