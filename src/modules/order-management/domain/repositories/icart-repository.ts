import { EntityManager } from 'typeorm';
import { Cart } from '../aggregates/cart';

/**
 * Cart Repository Interface
 *
 * Defines persistence operations for Cart aggregate
 */
export interface ICartRepository {
  /**
   * Save a cart (create or update)
   * @param cart - The cart aggregate to save
   * @param manager - Optional EntityManager for transaction support
   */
  save(cart: Cart, manager?: EntityManager): Promise<void>;

  /**
   * Find cart by ID
   */
  findById(id: string): Promise<Cart | null>;

  /**
   * Find active cart for user
   * @param userId - The user ID
   * @param manager - Optional EntityManager for transaction support
   */
  findActiveByUserId(userId: string, manager?: EntityManager): Promise<Cart | null>;

  /**
   * Delete a cart
   */
  delete(id: string): Promise<void>;
}

