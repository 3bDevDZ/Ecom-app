import { v4 as uuidv4 } from 'uuid';
import { AggregateRoot } from '../base/aggregate-root';
import { OrderItem, OrderItemProps } from '../entities/order-item';
import { OrderNumber } from '../value-objects/order-number';
import { OrderStatus } from '../value-objects/order-status';
import { Address } from '../value-objects/address';
import { OrderPlaced } from '../events/order-placed';
import { OrderCancelled } from '../events/order-cancelled';
import { InventoryReservationRequested } from '../events/inventory-reservation-requested';

export interface CreateOrderProps {
  userId: string;
  cartId: string;
  items: OrderItemProps[];
  shippingAddress: Address;
  billingAddress: Address;
}

/**
 * Order Aggregate Root
 *
 * Represents a customer order with immutable line items
 */
export class Order extends AggregateRoot {
  private readonly _id: string;
  private readonly _orderNumber: OrderNumber;
  private readonly _userId: string;
  private readonly _cartId: string;
  private _status: OrderStatus;
  private readonly _items: OrderItem[] = [];
  private readonly _shippingAddress: Address;
  private readonly _billingAddress: Address;
  private _cancellationReason?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _deliveredAt?: Date;

  private constructor(
    id: string,
    orderNumber: OrderNumber,
    userId: string,
    cartId: string,
    status: OrderStatus,
    items: OrderItem[],
    shippingAddress: Address,
    billingAddress: Address,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    cancellationReason?: string,
    deliveredAt?: Date,
  ) {
    super();
    this._id = id;
    this._orderNumber = orderNumber;
    this._userId = userId;
    this._cartId = cartId;
    this._status = status;
    this._items = items;
    this._shippingAddress = shippingAddress;
    this._billingAddress = billingAddress;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._cancellationReason = cancellationReason;
    this._deliveredAt = deliveredAt;
  }

  static create(props: CreateOrderProps): Order {
    if (!props.items || props.items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    const id = uuidv4();
    const orderNumber = OrderNumber.generate();
    const items = props.items.map(itemProps => OrderItem.create(itemProps));

    const order = new Order(
      id,
      orderNumber,
      props.userId,
      props.cartId,
      OrderStatus.PENDING,
      items,
      props.shippingAddress,
      props.billingAddress,
      new Date(),
      new Date(),
    );

    // Raise domain events
    order.addDomainEvent(
      new OrderPlaced(id, {
        orderId: id,
        orderNumber: orderNumber.value,
        userId: props.userId,
        cartId: props.cartId,
        totalAmount: order.totalAmount,
        currency: items[0].currency,
        itemCount: order.itemCount,
      }),
    );

    order.addDomainEvent(
      new InventoryReservationRequested(id, {
        orderId: id,
        orderNumber: orderNumber.value,
        items: items.map(item => ({
          productId: item.productId,
          sku: item.sku,
          quantity: item.quantity,
        })),
      }),
    );

    return order;
  }

  static reconstitute(
    id: string,
    orderNumber: OrderNumber,
    userId: string,
    cartId: string,
    status: OrderStatus,
    items: OrderItem[],
    shippingAddress: Address,
    billingAddress: Address,
    createdAt: Date,
    updatedAt: Date,
    cancellationReason?: string,
    deliveredAt?: Date,
  ): Order {
    return new Order(
      id,
      orderNumber,
      userId,
      cartId,
      status,
      items,
      shippingAddress,
      billingAddress,
      createdAt,
      updatedAt,
      cancellationReason,
      deliveredAt,
    );
  }

  process(): void {
    this.transitionTo(OrderStatus.PROCESSING);
  }

  ship(): void {
    this.transitionTo(OrderStatus.SHIPPED);
  }

  deliver(): void {
    this.transitionTo(OrderStatus.DELIVERED);
    this._deliveredAt = new Date();
  }

  cancel(reason: string): void {
    if (!reason || reason.trim() === '') {
      throw new Error('Cancellation reason is required');
    }

    this.transitionTo(OrderStatus.CANCELLED);
    this._cancellationReason = reason;

    // Raise domain event
    this.addDomainEvent(
      new OrderCancelled(this._id, {
        orderId: this._id,
        orderNumber: this._orderNumber.value,
        userId: this._userId,
        reason,
      }),
    );
  }

  private transitionTo(newStatus: OrderStatus): void {
    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(
        `Invalid status transition from ${this._status.value} to ${newStatus.value}`,
      );
    }

    this._status = newStatus;
    this._updatedAt = new Date();
  }

  isModifiable(): boolean {
    return this._status.isPending();
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get orderNumber(): OrderNumber {
    return this._orderNumber;
  }

  get userId(): string {
    return this._userId;
  }

  get cartId(): string {
    return this._cartId;
  }

  get status(): OrderStatus {
    return this._status;
  }

  get items(): readonly OrderItem[] {
    return [...this._items];
  }

  get shippingAddress(): Address {
    return this._shippingAddress;
  }

  get billingAddress(): Address {
    return this._billingAddress;
  }

  get totalAmount(): number {
    return this._items.reduce((total, item) => total + item.lineTotal, 0);
  }

  get itemCount(): number {
    return this._items.reduce((count, item) => count + item.quantity, 0);
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deliveredAt(): Date | undefined {
    return this._deliveredAt;
  }

  get cancellationReason(): string | undefined {
    return this._cancellationReason;
  }
}

