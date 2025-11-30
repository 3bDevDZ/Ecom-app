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
   */
  save(order: Order, manager?: EntityManager): Promise<void>;

  /**
   * Find order by ID
   */
  findById(id: string): Promise<Order | null>;

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

