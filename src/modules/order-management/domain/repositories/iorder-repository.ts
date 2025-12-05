import { Order } from '../aggregates/order';

/**
 * Order Repository Interface
 *
 * Defines persistence operations for Order aggregate.
 * Transaction management is handled automatically by the base repository.
 */
export interface IOrderRepository {
  /**
   * Save an order (create or update)
   * Uses the current transaction's EntityManager if available
   */
  save(order: Order): Promise<void>;

  /**
   * Find order by ID
   * Uses the current transaction's EntityManager if available
   */
  findById(id: string): Promise<Order | null>;

  /**
   * Find order by order number
   * Uses the current transaction's EntityManager if available
   */
  findByOrderNumber(orderNumber: string): Promise<Order | null>;

  /**
   * Find all orders for a user
   * Uses the current transaction's EntityManager if available
   */
  findByUserId(userId: string): Promise<Order[]>;

  /**
   * Find orders by user ID with pagination
   * Uses the current transaction's EntityManager if available
   */
  findByUserIdPaginated(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ orders: Order[]; total: number }>;
}

