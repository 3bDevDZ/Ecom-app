import { v4 as uuidv4 } from 'uuid';
import { AggregateRoot } from '../base/aggregate-root';
import { CartItem, CartItemProps } from '../entities/cart-item';
import { CartCleared } from '../events/cart-cleared';
import { ItemAddedToCart } from '../events/item-added-to-cart';
import { ItemRemovedFromCart } from '../events/item-removed-from-cart';
import { CartStatus } from '../value-objects/cart-status';

/**
 * Cart Aggregate Root
 *
 * Represents a shopping cart that can contain multiple items
 */
export class Cart extends AggregateRoot {
  private readonly _id: string;
  private readonly _userId: string;
  private _status: CartStatus;
  private _items: CartItem[] = [];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: string,
    userId: string,
    status: CartStatus,
    items: CartItem[] = [],
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    super();
    this._id = id;
    this._userId = userId;
    this._status = status;
    this._items = items;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  static create(userId: string): Cart {
    const cart = new Cart(
      uuidv4(),
      userId,
      CartStatus.ACTIVE,
      [],
      new Date(),
      new Date(),
    );

    return cart;
  }

  static reconstitute(
    id: string,
    userId: string,
    status: CartStatus,
    items: CartItem[],
    createdAt: Date,
    updatedAt: Date,
  ): Cart {
    return new Cart(id, userId, status, items, createdAt, updatedAt);
  }

  addItem(itemProps: CartItemProps): void {
    this.ensureIsActive();

    // Check if product already exists in cart
    const existingItem = this._items.find(
      item => item.productId === itemProps.productId && item.sku === itemProps.sku,
    );

    if (existingItem) {
      // Update quantity of existing item
      existingItem.updateQuantity(existingItem.quantity + itemProps.quantity);
    } else {
      // Add new item
      const newItem = CartItem.create(itemProps);
      this._items.push(newItem);
    }

    this._updatedAt = new Date();

    // Raise domain event
    this.addDomainEvent(
      new ItemAddedToCart(this._id, {
        cartId: this._id,
        userId: this._userId,
        productId: itemProps.productId,
        productName: itemProps.productName,
        sku: itemProps.sku,
        quantity: itemProps.quantity,
        unitPrice: itemProps.unitPrice,
        currency: itemProps.currency,
      }),
    );
  }

  updateItemQuantity(itemId: string, newQuantity: number): void {
    this.ensureIsActive();

    const item = this._items.find(i => i.id === itemId);
    if (!item) {
      throw new Error('Item not found in cart');
    }

    item.updateQuantity(newQuantity);
    this._updatedAt = new Date();
  }

  removeItem(itemId: string): void {
    this.ensureIsActive();

    const itemIndex = this._items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Item not found in cart');
    }

    const removedItem = this._items[itemIndex];
    this._items.splice(itemIndex, 1);
    this._updatedAt = new Date();

    // Raise domain event
    this.addDomainEvent(
      new ItemRemovedFromCart(this._id, {
        cartId: this._id,
        userId: this._userId,
        productId: removedItem.productId,
        quantity: removedItem.quantity,
      }),
    );
  }

  clear(): void {
    this._items = [];
    this._updatedAt = new Date();

    // Raise domain event
    this.addDomainEvent(
      new CartCleared(this._id, {
        cartId: this._id,
        userId: this._userId,
      }),
    );
  }

  convert(): void {
    if (this.isEmpty()) {
      throw new Error('Cannot convert empty cart');
    }

    if (this._status.canTransitionTo(CartStatus.CONVERTED)) {
      this._status = CartStatus.CONVERTED;
      this._updatedAt = new Date();
    } else {
      throw new Error('Invalid cart status transition');
    }
  }

  abandon(): void {
    if (this._status.canTransitionTo(CartStatus.ABANDONED)) {
      this._status = CartStatus.ABANDONED;
      this._updatedAt = new Date();
    } else {
      throw new Error('Invalid cart status transition');
    }
  }

  isEmpty(): boolean {
    return this._items.length === 0;
  }

  private ensureIsActive(): void {
    if (!this._status.isActive()) {
      throw new Error('Cannot modify cart that is not active');
    }
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get status(): CartStatus {
    return this._status;
  }

  get items(): readonly CartItem[] {
    return [...this._items];
  }

  get totalAmount(): number {
    return this._items.reduce((total, item) => total + item.lineTotal, 0);
  }

  get itemCount(): number {
    // Return number of unique products (items), not total quantity
    return this._items.length;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}

