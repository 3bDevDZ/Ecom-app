/**
 * Order Item DTO
 */
export class OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  lineTotal: number;
}

