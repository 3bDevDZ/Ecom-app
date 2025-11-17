/**
 * Frontend TypeScript types matching backend DTOs
 */

export interface Money {
  amount: number;
  currency: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: Money;
  variant?: Record<string, string>;
  subtotal: Money;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Document {
  id: string;
  type: string;
  name: string;
  url: string;
  createdAt: string;
  icon: string;
}

export interface ShippingInfo {
  method: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
}

export interface PaymentInfo {
  method: string;
  transactionId: string;
  paidAt: string;
  billingAddress: Address;
}

export type OrderStatus = 'PLACED' | 'PROCESSED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export interface Order {
  id: string;
  customer: Customer;
  items: OrderItem[];
  status: OrderStatus;
  shippingAddress: Address;
  shippingInfo: ShippingInfo;
  paymentInfo: PaymentInfo;
  documents: Document[];
  subtotal: Money;
  taxAmount: Money;
  shippingCost: Money;
  totalAmount: Money;
  createdAt: string;
  updatedAt: string;
}
