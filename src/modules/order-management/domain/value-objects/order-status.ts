/**
 * OrderStatus Value Object
 *
 * Represents order status with valid state transitions
 */
export class OrderStatus {
  // Static instances for each status
  static readonly PENDING = new OrderStatus('pending');
  static readonly PROCESSING = new OrderStatus('processing');
  static readonly SHIPPED = new OrderStatus('shipped');
  static readonly DELIVERED = new OrderStatus('delivered');
  static readonly CANCELLED = new OrderStatus('cancelled');

  private constructor(private readonly _value: string) {}

  /**
   * Create OrderStatus from string value
   */
  static fromString(value: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      pending: OrderStatus.PENDING,
      processing: OrderStatus.PROCESSING,
      shipped: OrderStatus.SHIPPED,
      delivered: OrderStatus.DELIVERED,
      cancelled: OrderStatus.CANCELLED,
    };

    const status = statusMap[value.toLowerCase()];
    if (!status) {
      throw new Error(`Invalid order status: ${value}`);
    }

    return status;
  }

  get value(): string {
    return this._value;
  }

  /**
   * Check if transition to another status is valid
   */
  canTransitionTo(newStatus: OrderStatus): boolean {
    const transitions: Record<string, string[]> = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    const allowedTransitions = transitions[this._value] || [];
    return allowedTransitions.includes(newStatus._value);
  }

  /**
   * Check if this is a terminal status (no further transitions possible)
   */
  isTerminal(): boolean {
    return this._value === 'delivered' || this._value === 'cancelled';
  }

  isPending(): boolean {
    return this._value === 'pending';
  }

  isProcessing(): boolean {
    return this._value === 'processing';
  }

  isShipped(): boolean {
    return this._value === 'shipped';
  }

  isDelivered(): boolean {
    return this._value === 'delivered';
  }

  isCancelled(): boolean {
    return this._value === 'cancelled';
  }

  equals(other: OrderStatus): boolean {
    if (!other) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

