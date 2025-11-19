import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { SKU } from '../value-objects/sku';
import { Money } from '../value-objects/money';
import { ProductImage } from '../value-objects/product-image';
import { ProductVariant } from '../entities/product-variant';
import { Result } from '../../../../shared/domain/result';

/**
 * Product Aggregate Root
 *
 * Represents a product in the catalog with pricing, variants, and inventory.
 * This is the main aggregate for the Product Catalog bounded context.
 *
 * Business Rules:
 * - Must have at least one image
 * - SKU must be unique
 * - Name limited to 200 chars, description to 2000 chars
 * - Min order quantity >= 1
 * - Max order quantity >= min or null
 * - Variants must have unique SKUs and attribute combinations
 */
export class Product extends AggregateRoot {
  private _sku: SKU;
  private _name: string;
  private _description: string;
  private _categoryId: string;
  private _brand: string;
  private _images: ProductImage[];
  private _variants: ProductVariant[];
  private _basePrice: Money;
  private _minOrderQuantity: number;
  private _maxOrderQuantity: number | null;
  private _isActive: boolean;
  private _tags: string[];

  private static readonly MAX_NAME_LENGTH = 200;
  private static readonly MAX_DESCRIPTION_LENGTH = 2000;

  private constructor(
    id: string,
    sku: SKU,
    name: string,
    description: string,
    categoryId: string,
    brand: string,
    images: ProductImage[],
    basePrice: Money,
  ) {
    super(id);
    this._sku = sku;
    this._name = name;
    this._description = description;
    this._categoryId = categoryId;
    this._brand = brand;
    this._images = images;
    this._variants = [];
    this._basePrice = basePrice;
    this._minOrderQuantity = 1;
    this._maxOrderQuantity = null;
    this._isActive = true;
    this._tags = [];
  }

  public static create(
    id: string,
    sku: SKU,
    name: string,
    description: string,
    categoryId: string,
    brand: string,
    images: ProductImage[],
    basePrice: Money,
  ): Product {
    Product.validateName(name);
    Product.validateDescription(description);
    Product.validateImages(images);

    return new Product(id, sku, name, description, categoryId, brand, images, basePrice);
  }

  // Getters
  get sku(): SKU {
    return this._sku;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get categoryId(): string {
    return this._categoryId;
  }

  get brand(): string {
    return this._brand;
  }

  get images(): ProductImage[] {
    return [...this._images];
  }

  get variants(): ProductVariant[] {
    return [...this._variants];
  }

  get basePrice(): Money {
    return this._basePrice;
  }

  get minOrderQuantity(): number {
    return this._minOrderQuantity;
  }

  get maxOrderQuantity(): number | null {
    return this._maxOrderQuantity;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get tags(): string[] {
    return [...this._tags];
  }

  // Validation
  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Product name cannot be empty');
    }

    if (name.length > this.MAX_NAME_LENGTH) {
      throw new Error(`Product name cannot exceed ${this.MAX_NAME_LENGTH} characters`);
    }
  }

  private static validateDescription(description: string): void {
    if (description.length > this.MAX_DESCRIPTION_LENGTH) {
      throw new Error(`Product description cannot exceed ${this.MAX_DESCRIPTION_LENGTH} characters`);
    }
  }

  private static validateImages(images: ProductImage[]): void {
    if (images.length === 0) {
      throw new Error('Product must have at least one image');
    }
  }

  // Business operations
  public updateDetails(
    name: string,
    description: string,
    categoryId: string,
    brand: string,
  ): void {
    Product.validateName(name);
    Product.validateDescription(description);

    this._name = name.trim();
    this._description = description;
    this._categoryId = categoryId;
    this._brand = brand;
    this.touch();
  }

  public updatePricing(basePrice: Money): void {
    this._basePrice = basePrice;
    this.touch();
  }

  public setOrderQuantities(min: number, max: number | null): Result<void> {
    if (min < 1) {
      return Result.fail('Minimum order quantity must be at least 1');
    }

    if (max !== null && max < min) {
      return Result.fail('Maximum order quantity must be greater than or equal to minimum');
    }

    this._minOrderQuantity = min;
    this._maxOrderQuantity = max;
    this.touch();

    return Result.ok();
  }

  // Variant management
  public addVariant(variant: ProductVariant): Result<void> {
    // Check for duplicate SKU
    if (this._variants.some(v => v.sku.equals(variant.sku))) {
      return Result.fail(`Variant with SKU ${variant.sku.value} already exists`);
    }

    // Check for duplicate attribute combination
    const variantAttributes = JSON.stringify(Array.from(variant.attributes.entries()).sort());
    if (this._variants.some(v => {
      const existingAttributes = JSON.stringify(Array.from(v.attributes.entries()).sort());
      return existingAttributes === variantAttributes;
    })) {
      return Result.fail('Variant with these attributes already exists');
    }

    this._variants.push(variant);
    this.touch();

    return Result.ok();
  }

  public removeVariant(variantId: string): Result<void> {
    const index = this._variants.findIndex(v => v.id === variantId);

    if (index === -1) {
      return Result.fail('Variant not found');
    }

    this._variants.splice(index, 1);
    this.touch();

    return Result.ok();
  }

  public hasVariants(): boolean {
    return this._variants.length > 0;
  }

  // Availability
  public checkAvailability(quantity: number, variantId?: string): boolean {
    if (!this._isActive) {
      return false;
    }

    if (variantId) {
      const variant = this._variants.find(v => v.id === variantId);
      return variant ? variant.isAvailable(quantity) : false;
    }

    // For products without variants, we assume availability
    // (actual inventory would be tracked separately)
    return true;
  }

  // Activation
  public activate(): void {
    this._isActive = true;
    this.touch();
  }

  public deactivate(): void {
    this._isActive = false;
    this.touch();
  }

  // Tags
  public addTag(tag: string): void {
    const normalized = tag.trim().toLowerCase();
    if (!this._tags.includes(normalized)) {
      this._tags.push(normalized);
      this.touch();
    }
  }

  public removeTag(tag: string): void {
    const normalized = tag.trim().toLowerCase();
    const index = this._tags.indexOf(normalized);
    if (index !== -1) {
      this._tags.splice(index, 1);
      this.touch();
    }
  }
}
