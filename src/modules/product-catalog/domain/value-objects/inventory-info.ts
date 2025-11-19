import { ValueObject } from '../../../../shared/domain/value-object.base';
import { Result } from '../../../../shared/domain/result';

interface InventoryInfoProps {
  availableQuantity: number;
  reservedQuantity: number;
  lastRestockedAt: Date | null;
}

/**
 * InventoryInfo Value Object
 *
 * Represents inventory status with available and reserved quantities.
 * Supports reservation, release, and restocking operations.
 *
 * @example
 * const inventory = new InventoryInfo(100, 0);
 * const result = inventory.reserve(30);
 * // result.value has 70 available, 30 reserved
 */
export class InventoryInfo extends ValueObject<InventoryInfoProps> {
  constructor(
    availableQuantity: number,
    reservedQuantity: number = 0,
    lastRestockedAt: Date | null = null,
  ) {
    super({
      availableQuantity: InventoryInfo.validateQuantity(availableQuantity, 'Available'),
      reservedQuantity: InventoryInfo.validateQuantity(reservedQuantity, 'Reserved'),
      lastRestockedAt,
    });
  }

  get availableQuantity(): number {
    return this.props.availableQuantity;
  }

  get reservedQuantity(): number {
    return this.props.reservedQuantity;
  }

  get totalQuantity(): number {
    return this.availableQuantity + this.reservedQuantity;
  }

  get lastRestockedAt(): Date | null {
    return this.props.lastRestockedAt;
  }

  private static validateQuantity(quantity: number, name: string): number {
    if (quantity < 0) {
      throw new Error(`${name} quantity cannot be negative`);
    }
    return quantity;
  }

  /**
   * Reserve quantity from available stock
   */
  public reserve(quantity: number): Result<InventoryInfo> {
    if (quantity <= 0) {
      return Result.fail('Reservation quantity must be positive');
    }

    if (quantity > this.availableQuantity) {
      return Result.fail(
        `Insufficient inventory. Requested: ${quantity}, Available: ${this.availableQuantity}`,
      );
    }

    return Result.ok(
      new InventoryInfo(
        this.availableQuantity - quantity,
        this.reservedQuantity + quantity,
        this.lastRestockedAt,
      ),
    );
  }

  /**
   * Release reserved quantity back to available
   */
  public release(quantity: number): Result<InventoryInfo> {
    if (quantity <= 0) {
      return Result.fail('Release quantity must be positive');
    }

    if (quantity > this.reservedQuantity) {
      return Result.fail(
        `Cannot release more than reserved. Requested: ${quantity}, Reserved: ${this.reservedQuantity}`,
      );
    }

    return Result.ok(
      new InventoryInfo(
        this.availableQuantity + quantity,
        this.reservedQuantity - quantity,
        this.lastRestockedAt,
      ),
    );
  }

  /**
   * Add quantity to available stock (restocking)
   */
  public restock(quantity: number): Result<InventoryInfo> {
    if (quantity <= 0) {
      return Result.fail('Restock quantity must be positive');
    }

    return Result.ok(
      new InventoryInfo(
        this.availableQuantity + quantity,
        this.reservedQuantity,
        new Date(),
      ),
    );
  }

  /**
   * Check if requested quantity is available
   */
  public isAvailable(requestedQuantity: number): boolean {
    return this.availableQuantity >= requestedQuantity;
  }

  /**
   * Check if out of stock
   */
  public isOutOfStock(): boolean {
    return this.availableQuantity === 0;
  }
}
