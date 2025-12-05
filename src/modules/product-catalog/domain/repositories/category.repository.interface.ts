import { Category } from '../aggregates/category';

/**
 * Category Repository Interface
 *
 * Defines the contract for category persistence operations.
 * This interface belongs to the domain layer and will be implemented
 * by the infrastructure layer using TypeORM.
 */
export interface ICategoryRepository {
  /**
   * Find a category by its ID
   * @param id - The category ID
   * @returns The category or null if not found
   */
  findById(id: string): Promise<Category | null>;

  /**
   * Save a category (create or update)
   * @param category - The category to save
   * @returns The saved category
   */
  save(category: Category): Promise<Category>;

  /**
   * Delete a category by its ID
   * @param id - The category ID
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a category exists by its ID
   * @param id - The category ID
   * @returns True if the category exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count all categories
   * @returns Total number of categories
   */
  count(): Promise<number>;

  /**
   * Find all categories with pagination
   * @param skip - Number of records to skip
   * @param take - Number of records to take
   * @returns Array of categories
   */
  findAll(skip?: number, take?: number): Promise<Category[]>;
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
