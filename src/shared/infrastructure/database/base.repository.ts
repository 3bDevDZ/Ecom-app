import { AggregateRoot } from '../../domain/aggregate-root.base';

/**
 * Base Repository Interface
 *
 * Defines the contract for all repositories in the infrastructure layer.
 * Repositories are responsible for persisting and retrieving aggregates.
 *
 * Following the Repository pattern from DDD, repositories:
 * - Work with aggregate roots only
 * - Provide collection-like interface
 * - Abstract persistence details from domain
 *
 * @example
 * export interface IProductRepository extends IBaseRepository<Product> {
 *   findBySku(sku: string): Promise<Product | null>;
 *   findByCategory(categoryId: string): Promise<Product[]>;
 * }
 */
export interface IBaseRepository<T extends AggregateRoot> {
  /**
   * Find an aggregate by its ID
   * @param id - The unique identifier of the aggregate
   * @returns The aggregate or null if not found
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all aggregates with optional pagination
   * @param skip - Number of records to skip
   * @param take - Number of records to take
   * @returns Array of aggregates
   */
  findAll(skip?: number, take?: number): Promise<T[]>;

  /**
   * Save an aggregate (create or update)
   * @param aggregate - The aggregate to save
   * @returns The saved aggregate
   */
  save(aggregate: T): Promise<T>;

  /**
   * Delete an aggregate by its ID
   * @param id - The unique identifier of the aggregate to delete
   * @returns void
   */
  delete(id: string): Promise<void>;

  /**
   * Check if an aggregate exists by ID
   * @param id - The unique identifier to check
   * @returns true if exists, false otherwise
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count total number of aggregates
   * @returns Total count
   */
  count(): Promise<number>;
}
