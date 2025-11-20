/**
 * Product Search Parameters DTO
 * Used to group query parameters for product search endpoint
 */
export class ProductSearchParamsDto {
  search?: string;
  categoryId?: string;
  brand?: string;
  tags?: string;
  minPrice?: string;
  maxPrice?: string;
  isActive?: string;
  page?: string;
  limit?: string;
  format?: string;
  sortBy?: string;
}

