import { ValueObject } from '../../../../shared/domain/value-object.base';
import { Result } from '../../../../shared/domain/result';

export interface ShowcaseCategory {
  id: string;
  name: string;
  imageUrl: string;
  displayOrder: number;
}

interface ProductShowcaseProps {
  categories: ShowcaseCategory[];
}

export class ProductShowcase extends ValueObject<ProductShowcaseProps> {
  get categories(): ShowcaseCategory[] {
    return this.props.categories;
  }

  private constructor(props: ProductShowcaseProps) {
    super(props);
  }

  public static create(categories: ShowcaseCategory[]): Result<ProductShowcase> {
    const errors: string[] = [];

    for (const category of categories) {
      if (!category.name || category.name.trim().length === 0) {
        errors.push('Showcase category name cannot be empty');
      }
      if (!category.imageUrl || !this.isValidUrl(category.imageUrl)) {
        errors.push('Showcase category image must be a valid URL');
      }
      if (category.displayOrder < 0) {
        errors.push('Showcase category displayOrder must be non-negative');
      }
    }

    if (errors.length > 0) {
      return Result.fail<ProductShowcase>(errors);
    }

    return Result.ok<ProductShowcase>(new ProductShowcase({ categories }));
  }

  private static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
