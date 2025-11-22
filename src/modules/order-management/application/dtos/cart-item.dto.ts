/**
 * Cart Item DTO
 */
export class CartItemDto {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  lineTotal: number;
}

