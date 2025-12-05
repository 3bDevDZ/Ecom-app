import { Cart } from '../aggregates/cart';

/**
 * Cart Repository Interface
 *
 * Defines persistence operations for Cart aggregate.
 * Transaction management is handled automatically by the base repository.
 */
export interface ICartRepository {
  /**
   * Save a cart (create or update)
   * Uses the current transaction's EntityManager if available
   */
  save(cart: Cart): Promise<void>;

  /**
   * Find cart by ID
   * Uses the current transaction's EntityManager if available
   */
  findById(id: string): Promise<Cart | null>;

  /**
   * Find active cart for user
   * Uses the current transaction's EntityManager if available
   */
  findActiveByUserId(userId: string): Promise<Cart | null>;

  /**
   * Delete a cart
   * Uses the current transaction's EntityManager if available
   */
  delete(id: string): Promise<void>;
}

