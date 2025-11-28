import { EntityManager } from 'typeorm';
import { Order } from '../aggregates/order';

/**
 * Order Repository Interface
 *
 * Defines persistence operations for Order aggregate
 */
export interface IOrderRepository {
  /**
   * Save an order (create or update)
   * @param order - The order aggregate to save
   * @param manager - Optional EntityManager for transaction support
   */
  save(order: Order, manager?: EntityManager): Promise<void>;

  /**
   * Find order by ID
   * @param id - The order ID
   * @param manager - Optional EntityManager for transaction support
   */
  findById(id: string, manager?: EntityManager): Promise<Order | null>;

  /**
   * Find order by order number
   */
  findByOrderNumber(orderNumber: string): Promise<Order | null>;

  /**
   * Find all orders for a user
   */
  findByUserId(userId: string): Promise<Order[]>;

  /**
   * Find orders by user ID with pagination
   */
  findByUserIdPaginated(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ orders: Order[]; total: number }>;
}

