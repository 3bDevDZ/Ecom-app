import { Category } from '../aggregates/category';
import { IBaseRepository } from '../../../../shared/infrastructure/database/base.repository';

/**
 * Category Repository Interface
 *
 * Defines the contract for category persistence operations.
 * This interface belongs to the domain layer and will be implemented
 * by the infrastructure layer using TypeORM.
 */
export interface ICategoryRepository extends IBaseRepository<Category> {
  /**
   * Find a category by its slug
   * @param slug - The category slug (URL-friendly identifier)
   * @returns The category or null if not found
   */
  findBySlug(slug: string): Promise<Category | null>;

  /**
   * Find all root categories (categories without a parent)
   * @param skip - Number of records to skip for pagination
   * @param take - Number of records to take for pagination
   * @returns Array of root categories
   */
  findRootCategories(skip?: number, take?: number): Promise<Category[]>;

  /**
   * Find all subcategories of a parent category
   * @param parentId - The parent category ID
   * @param skip - Number of records to skip for pagination
   * @param take - Number of records to take for pagination
   * @returns Array of subcategories
   */
  findByParent(parentId: string, skip?: number, take?: number): Promise<Category[]>;

  /**
   * Check if a category with the given slug already exists
   * @param slug - The category slug
   * @returns True if a category with this slug exists
   */
  existsBySlug(slug: string): Promise<boolean>;

  /**
   * Count subcategories of a parent category
   * @param parentId - The parent category ID
   * @returns Number of subcategories
   */
  countByParent(parentId: string): Promise<number>;

  /**
   * Get the full category path (breadcrumb) for a category
   * This returns the category and all its ancestors in order from root to the target category
   * @param categoryId - The category ID
   * @returns Array of categories from root to target
   */
  getCategoryPath(categoryId: string): Promise<Category[]>;

  /**
   * Find all active categories ordered by display order
   * @param skip - Number of records to skip for pagination
   * @param take - Number of records to take for pagination
   * @returns Array of active categories
   */
  findActiveOrderedByDisplay(skip?: number, take?: number): Promise<Category[]>;
}
