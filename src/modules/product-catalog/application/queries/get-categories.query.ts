import { BaseQuery } from '../../../../shared/application/base-query';

/**
 * GetCategoriesQuery
 *
 * Query to retrieve categories from the catalog.
 * Supports filtering by parent to get hierarchical categories,
 * and can optionally retrieve only active categories.
 */
export class GetCategoriesQuery extends BaseQuery {
  constructor(
    public readonly parentId?: string | null, // null = root categories, undefined = all categories
    public readonly isActive?: boolean,
    public readonly page: number = 1,
    public readonly limit: number = 100,
  ) {
    super();
  }

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
