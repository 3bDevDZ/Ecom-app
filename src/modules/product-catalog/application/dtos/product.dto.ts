import { ProductVariantDto } from './product-variant.dto';

/**
 * ProductImageDto
 *
 * Data Transfer Object for product images.
 */
export class ProductImageDto {
  constructor(
    public readonly url: string,
    public readonly altText: string,
    public readonly displayOrder: number,
    public readonly isPrimary: boolean,
  ) {}
}

/**
 * ProductDto
 *
 * Data Transfer Object for products.
 * Used in query responses to return product information.
 */
export class ProductDto {
  constructor(
    public readonly id: string,
    public readonly sku: string,
    public readonly name: string,
    public readonly description: string,
    public readonly categoryId: string,
    public readonly brand: string,
    public readonly images: ProductImageDto[],
    public readonly variants: ProductVariantDto[],
    public readonly basePrice: number,
    public readonly currency: string,
    public readonly minOrderQuantity: number,
    public readonly maxOrderQuantity: number | null,
    public readonly isActive: boolean,
    public readonly tags: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly totalAvailableQuantity?: number, // Optional: calculated from variants
    public readonly specifications?: Record<string, any>, // Optional: product specifications
    public readonly documents?: Array<{ // Optional: product documents
      title: string;
      type: string;
      size: string;
      url: string;
    }>,
    public readonly reviews?: Array<{ // Optional: product reviews
      userName: string;
      date: string;
      rating: number;
      comment: string;
    }>,
  ) {}

  /**
   * Get the primary image or the first image if no primary is set
   */
  public get primaryImage(): ProductImageDto | undefined {
    return this.images.find(img => img.isPrimary) || this.images[0];
  }

  /**
   * Check if the product has variants
   */
  public get hasVariants(): boolean {
    return this.variants.length > 0;
  }

  /**
   * Get the price range for products with variants
   */
  public get priceRange(): { min: number; max: number } | null {
    if (!this.hasVariants) {
      return null;
    }

    const prices = this.variants.map(v => v.calculateFinalPrice(this.basePrice));
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  /**
   * Get total available quantity (sum of all variant quantities)
   * Falls back to calculated value if not provided
   */
  public getTotalAvailableQuantity(): number {
    // Use provided value if available
    if (this.totalAvailableQuantity !== undefined) {
      return this.totalAvailableQuantity;
    }
    // Calculate from variants if not provided
    return this.variants.reduce((sum, v) => sum + v.availableQuantity, 0);
  }
}
