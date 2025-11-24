import { OrderItemDto } from './order-item.dto';

export interface AddressDto {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  contactName: string;
  contactPhone: string;
}

/**
 * Order DTO
 */
export class OrderDto {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  items: OrderItemDto[];
  totalAmount: number;
  itemCount: number;
  shippingAddress: AddressDto;
  billingAddress: AddressDto;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
  cancellationReason?: string;
  receiptUrl?: string;
}

