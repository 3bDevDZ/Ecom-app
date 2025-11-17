import { OrderItem } from './order-item.entity';
import { Customer } from './customer.entity';
import { Document } from './document.entity';
import { OrderStatusVO, OrderStatus } from '../value-objects/order-status';
import { Money } from '../value-objects/money';
import { Address } from '../value-objects/address';

/**
 * Shipping Information
 */
export interface ShippingInfo {
  method: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
}

/**
 * Payment Information
 */
export interface PaymentInfo {
  method: string; // e.g., 'Credit Card', 'PayPal', 'Stripe'
  transactionId: string;
  paidAt: Date;
  billingAddress: Address;
}

/**
 * Order Entity Props
 */
export interface OrderProps {
  id: string;
  customer: Customer;
  items: OrderItem[];
  status: OrderStatusVO;
  shippingAddress: Address;
  shippingInfo: ShippingInfo;
  paymentInfo: PaymentInfo;
  documents: Document[];
  subtotal: Money;
  taxAmount: Money;
  shippingCost: Money;
  totalAmount: Money;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order Entity (Aggregate Root)
 * Encapsulates all order-related business logic
 */
export class Order {
  private constructor(private props: OrderProps) {
    this.validate();
  }

  static create(props: OrderProps): Order {
    return new Order(props);
  }

  // Getters
  getId(): string {
    return this.props.id;
  }

  getCustomer(): Customer {
    return this.props.customer;
  }

  getItems(): OrderItem[] {
    return [...this.props.items];
  }

  getStatus(): OrderStatusVO {
    return this.props.status;
  }

  getShippingAddress(): Address {
    return this.props.shippingAddress;
  }

  getShippingInfo(): ShippingInfo {
    return { ...this.props.shippingInfo };
  }

  getPaymentInfo(): PaymentInfo {
    return { ...this.props.paymentInfo };
  }

  getDocuments(): Document[] {
    return [...this.props.documents];
  }

  getSubtotal(): Money {
    return this.props.subtotal;
  }

  getTaxAmount(): Money {
    return this.props.taxAmount;
  }

  getShippingCost(): Money {
    return this.props.shippingCost;
  }

  getTotalAmount(): Money {
    return this.props.totalAmount;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Methods
  updateStatus(newStatus: OrderStatus): void {
    if (!this.props.status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot transition from ${this.props.status.getValue()} to ${newStatus}`,
      );
    }
    this.props.status = OrderStatusVO.create(newStatus);
    this.props.updatedAt = new Date();
  }

  addDocument(document: Document): void {
    this.props.documents.push(document);
    this.props.updatedAt = new Date();
  }

  updateShippingInfo(info: Partial<ShippingInfo>): void {
    this.props.shippingInfo = {
      ...this.props.shippingInfo,
      ...info,
    };
    this.props.updatedAt = new Date();
  }

  canBeCancelled(): boolean {
    const cancellableStatuses = [OrderStatus.PLACED, OrderStatus.PROCESSED];
    return cancellableStatuses.includes(this.props.status.getValue());
  }

  canBeReturned(): boolean {
    return this.props.status.getValue() === OrderStatus.DELIVERED;
  }

  toJSON() {
    return {
      id: this.props.id,
      customer: this.props.customer.toJSON(),
      items: this.props.items.map((item) => item.toJSON()),
      status: this.props.status.getValue(),
      shippingAddress: this.props.shippingAddress.toJSON(),
      shippingInfo: {
        ...this.props.shippingInfo,
        estimatedDelivery: this.props.shippingInfo.estimatedDelivery?.toISOString(),
        actualDelivery: this.props.shippingInfo.actualDelivery?.toISOString(),
      },
      paymentInfo: {
        method: this.props.paymentInfo.method,
        transactionId: this.props.paymentInfo.transactionId,
        paidAt: this.props.paymentInfo.paidAt.toISOString(),
        billingAddress: this.props.paymentInfo.billingAddress.toJSON(),
      },
      documents: this.props.documents.map((doc) => doc.toJSON()),
      subtotal: {
        amount: this.props.subtotal.getAmount(),
        currency: this.props.subtotal.getCurrency(),
      },
      taxAmount: {
        amount: this.props.taxAmount.getAmount(),
        currency: this.props.taxAmount.getCurrency(),
      },
      shippingCost: {
        amount: this.props.shippingCost.getAmount(),
        currency: this.props.shippingCost.getCurrency(),
      },
      totalAmount: {
        amount: this.props.totalAmount.getAmount(),
        currency: this.props.totalAmount.getCurrency(),
      },
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error('Order ID is required');
    }
    if (!this.props.items || this.props.items.length === 0) {
      throw new Error('Order must have at least one item');
    }
  }
}
