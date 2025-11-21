import { CartItemDto } from './cart-item.dto';

/**
 * Cart DTO
 */
export class CartDto {
  id: string;
  userId: string;
  status: string;
  items: CartItemDto[];
  totalAmount: number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

