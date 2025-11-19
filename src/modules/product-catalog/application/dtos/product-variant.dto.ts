/**
 * ProductVariantDto
 *
 * Data Transfer Object for product variants.
 * Used in query responses to return variant information.
 */
export class ProductVariantDto {
  constructor(
    public readonly id: string,
    public readonly sku: string,
    public readonly attributes: Record<string, string>, // e.g., { size: 'Large', color: 'Blue' }
    public readonly priceDelta: number | null,
    public readonly currency: string,
    public readonly availableQuantity: number,
    public readonly reservedQuantity: number,
    public readonly isActive: boolean,
  ) {}

  /**
   * Calculate the final price for this variant
   * @param basePrice The base product price
   * @returns The final price including any delta
   */
  public calculateFinalPrice(basePrice: number): number {
    if (this.priceDelta === null) {
      return basePrice;
    }
    return basePrice + this.priceDelta;
  }
}
