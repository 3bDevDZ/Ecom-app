/**
 * Order Status Value Object
 * Represents the current state of an order in the e-commerce flow
 */
export enum OrderStatus {
  PLACED = 'PLACED',
  PROCESSED = 'PROCESSED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export class OrderStatusVO {
  private constructor(private readonly value: OrderStatus) {
    this.validate();
  }

  static create(status: OrderStatus): OrderStatusVO {
    return new OrderStatusVO(status);
  }

  static fromString(status: string): OrderStatusVO {
    const orderStatus = OrderStatus[status as keyof typeof OrderStatus];
    if (!orderStatus) {
      throw new Error(`Invalid order status: ${status}`);
    }
    return new OrderStatusVO(orderStatus);
  }

  getValue(): OrderStatus {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  canTransitionTo(newStatus: OrderStatus): boolean {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PLACED]: [OrderStatus.PROCESSED, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    return transitions[this.value]?.includes(newStatus) ?? false;
  }

  private validate(): void {
    if (!Object.values(OrderStatus).includes(this.value)) {
      throw new Error(`Invalid order status: ${this.value}`);
    }
  }
}
