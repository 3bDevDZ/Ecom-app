import { Product } from '../aggregates/product';
import { IBaseRepository } from '../../../../shared/infrastructure/database/base.repository';

/**
 * Product Repository Interface
 *
 * Defines the contract for product persistence operations.
 * This interface belongs to the domain layer and will be implemented
 * by the infrastructure layer using TypeORM.
 */
export interface IProductRepository extends IBaseRepository<Product> {
  /**
   * Find a product by its SKU
   * @param sku - The product SKU
   * @returns The product or null if not found
   */
  findBySku(sku: string): Promise<Product | null>;

  /**
   * Find all products in a specific category
   * @param categoryId - The category ID
   * @param skip - Number of records to skip for pagination
   * @param take - Number of records to take for pagination
   * @returns Array of products in the category
   */
  findByCategory(categoryId: string, skip?: number, take?: number): Promise<Product[]>;

  /**
   * Search products by name, description, or tags
   * @param searchTerm - The search term
   * @param categoryId - Optional category filter
   * @param skip - Number of records to skip for pagination
   * @param take - Number of records to take for pagination
   * @returns Array of matching products
   */
  search(
    searchTerm: string,
    categoryId?: string,
    skip?: number,
    take?: number,
  ): Promise<Product[]>;

  /**
   * Find products by brand
   * @param brand - The brand name
   * @param skip - Number of records to skip for pagination
   * @param take - Number of records to take for pagination
   * @returns Array of products from the brand
   */
  findByBrand(brand: string, skip?: number, take?: number): Promise<Product[]>;

  /**
   * Find products by tags
   * @param tags - Array of tag names
   * @param skip - Number of records to skip for pagination
   * @param take - Number of records to take for pagination
   * @returns Array of products matching any of the tags
   */
  findByTags(tags: string[], skip?: number, take?: number): Promise<Product[]>;

  /**
   * Check if a product with the given SKU already exists
   * @param sku - The product SKU
   * @returns True if a product with this SKU exists
   */
  existsBySku(sku: string): Promise<boolean>;

  /**
   * Count products in a specific category
   * @param categoryId - The category ID
   * @returns Number of products in the category
   */
  countByCategory(categoryId: string): Promise<number>;

  /**
   * Count products matching a search term
   * @param searchTerm - The search term
   * @param categoryId - Optional category filter
   * @returns Number of matching products
   */
  countSearch(searchTerm: string, categoryId?: string): Promise<number>;
}
