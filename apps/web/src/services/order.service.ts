import { Order } from '../types/order.types';

/**
 * Order Service
 * Handles API communication for order-related operations
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

export class OrderService {
  /**
   * Fetch order details by ID
   */
  static async getOrderById(orderId: string): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch all orders for a customer
   */
  static async getCustomerOrders(customerId: string): Promise<Order[]> {
    const response = await fetch(`${API_BASE_URL}/api/orders/customer/${customerId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch customer orders: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Format money for display
   */
  static formatMoney(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Format date for display
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
