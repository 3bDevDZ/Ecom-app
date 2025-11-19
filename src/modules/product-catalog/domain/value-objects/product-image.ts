import { ValueObject } from '../../../../shared/domain/value-object.base';

interface ProductImageProps {
  url: string;
  altText: string;
  displayOrder: number;
  isPrimary: boolean;
}

/**
 * ProductImage Value Object
 *
 * Represents a product image with metadata.
 *
 * @example
 * const image = new ProductImage(
 *   'https://example.com/product.jpg',
 *   'Blue T-Shirt Front View',
 *   1,
 *   true
 * );
 */
export class ProductImage extends ValueObject<ProductImageProps> {
  private static readonly URL_PATTERN = /^https?:\/\/.+/;

  constructor(
    url: string,
    altText: string,
    displayOrder: number,
    isPrimary: boolean = false,
  ) {
    super({
      url: ProductImage.validateUrl(url),
      altText: ProductImage.validateAltText(altText),
      displayOrder: ProductImage.validateDisplayOrder(displayOrder),
      isPrimary,
    });
  }

  get url(): string {
    return this.props.url;
  }

  get altText(): string {
    return this.props.altText;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  private static validateUrl(url: string): string {
    if (!url || url.trim().length === 0) {
      throw new Error('Image URL cannot be empty');
    }

    if (!this.URL_PATTERN.test(url)) {
      throw new Error('Image URL must be a valid HTTP or HTTPS URL');
    }

    return url.trim();
  }

  private static validateAltText(altText: string): string {
    if (!altText || altText.trim().length === 0) {
      throw new Error('Image alt text cannot be empty');
    }

    return altText.trim();
  }

  private static validateDisplayOrder(displayOrder: number): number {
    if (displayOrder < 0) {
      throw new Error('Display order cannot be negative');
    }

    return displayOrder;
  }
}
