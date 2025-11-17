import { Order } from '../entities/order.entity';

/**
 * Order Repository Interface (Port)
 * Defines the contract for order persistence
 */
export interface IOrderRepository {
  /**
   * Find an order by its ID
   */
  findById(id: string): Promise<Order | null>;

  /**
   * Find all orders for a customer
   */
  findByCustomerId(customerId: string): Promise<Order[]>;

  /**
   * Save a new order
   */
  save(order: Order): Promise<Order>;

  /**
   * Update an existing order
   */
  update(order: Order): Promise<Order>;

  /**
   * Delete an order
   */
  delete(id: string): Promise<void>;

  /**
   * Find all orders (with pagination)
   */
  findAll(page: number, limit: number): Promise<{ orders: Order[]; total: number }>;
}
