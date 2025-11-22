import { Cart } from '../aggregates/cart';

/**
 * Cart Repository Interface
 *
 * Defines persistence operations for Cart aggregate
 */
export interface ICartRepository {
  /**
   * Save a cart (create or update)
   */
  save(cart: Cart): Promise<void>;

  /**
   * Find cart by ID
   */
  findById(id: string): Promise<Cart | null>;

  /**
   * Find active cart for user
   */
  findActiveByUserId(userId: string): Promise<Cart | null>;

  /**
   * Delete a cart
   */
  delete(id: string): Promise<void>;
}

