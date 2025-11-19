import { Entity } from '../../../../shared/domain/entity.base';
import { SKU } from '../value-objects/sku';
import { Money } from '../value-objects/money';
import { InventoryInfo } from '../value-objects/inventory-info';
import { Result } from '../../../../shared/domain/result';

/**
 * ProductVariant Entity
 *
 * Represents a specific variation of a product (e.g., size, color).
 * Each variant has its own SKU, optional price delta, and inventory.
 *
 * @example
 * const variant = ProductVariant.create(
 *   'variant-id',
 *   new SKU('SHIRT-L-BLUE'),
 *   new Map([['size', 'Large'], ['color', 'Blue']]),
 *   new Money(5), // +$5 for large size
 *   new InventoryInfo(100)
 * );
 */
export class ProductVariant extends Entity {
  private _sku: SKU;
  private _attributes: Map<string, string>;
  private _priceDelta: Money | null;
  private _inventory: InventoryInfo;
  private _isActive: boolean;

  private constructor(
    id: string,
    sku: SKU,
    attributes: Map<string, string>,
    priceDelta: Money | null,
    inventory: InventoryInfo,
  ) {
    super(id);
    this._sku = sku;
    this._attributes = attributes;
    this._priceDelta = priceDelta;
    this._inventory = inventory;
    this._isActive = true;
  }

  public static create(
    id: string,
    sku: SKU,
    attributes: Map<string, string>,
    priceDelta: Money | null,
    inventory: InventoryInfo,
  ): ProductVariant {
    if (attributes.size === 0) {
      throw new Error('Variant must have at least one attribute');
    }

    return new ProductVariant(id, sku, attributes, priceDelta, inventory);
  }

  get sku(): SKU {
    return this._sku;
  }

  get attributes(): Map<string, string> {
    return new Map(this._attributes);
  }

  get priceDelta(): Money | null {
    return this._priceDelta;
  }

  get inventory(): InventoryInfo {
    return this._inventory;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  public activate(): void {
    this._isActive = true;
    this.touch();
  }

  public deactivate(): void {
    this._isActive = false;
    this.touch();
  }

  public isAvailable(requestedQuantity: number): boolean {
    return this._inventory.isAvailable(requestedQuantity);
  }

  public reserveInventory(quantity: number): Result<void> {
    const result = this._inventory.reserve(quantity);

    if (result.isSuccess) {
      this._inventory = result.value;
      this.touch();
      return Result.ok();
    }

    return Result.fail(result.error || 'Failed to reserve inventory');
  }

  public releaseInventory(quantity: number): Result<void> {
    const result = this._inventory.release(quantity);

    if (result.isSuccess) {
      this._inventory = result.value;
      this.touch();
      return Result.ok();
    }

    return Result.fail(result.error || 'Failed to release inventory');
  }

  public restock(quantity: number): Result<void> {
    const result = this._inventory.restock(quantity);

    if (result.isSuccess) {
      this._inventory = result.value;
      this.touch();
      return Result.ok();
    }

    return Result.fail(result.error || 'Failed to restock inventory');
  }

  public calculatePrice(basePrice: Money): Money {
    if (!this._priceDelta) {
      return basePrice;
    }

    // For positive delta (premium pricing)
    if (this._priceDelta.amount >= 0) {
      return basePrice.add(this._priceDelta);
    }

    // For negative delta (discount), we need to handle it specially
    // Since Money doesn't allow negative amounts, we store the absolute value
    // and subtract it from the base price
    return basePrice.subtract(new Money(Math.abs(this._priceDelta.amount), this._priceDelta.currency));
  }
}
