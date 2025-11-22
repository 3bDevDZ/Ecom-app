import { BaseQuery } from '../../../../shared/application/base-query';

/**
 * SearchProductsQuery
 *
 * Query to search and filter products in the catalog.
 * Supports pagination, category filtering, brand filtering, and full-text search.
 */
export type SortByOption = 'best-match' | 'price-low' | 'price-high' | 'name' | 'name-desc';

export class SearchProductsQuery extends BaseQuery {
  constructor(
    public readonly searchTerm?: string,
    public readonly categoryId?: string | string[],
    public readonly brand?: string | string[],
    public readonly tags?: string[],
    public readonly minPrice?: number,
    public readonly maxPrice?: number,
    public readonly isActive?: boolean,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly sortBy?: SortByOption,
  ) {
    super();
    // Normalize arrays
    if (typeof this.categoryId === 'string') {
      (this as any).categoryId = [this.categoryId];
    }
    if (typeof this.brand === 'string') {
      (this as any).brand = [this.brand];
    }
  }

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
