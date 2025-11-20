import { BaseCommand } from '../../../../shared/application/base-command';

/**
 * CreateProductCommand
 *
 * Command to create a new product in the catalog.
 */
export class CreateProductCommand extends BaseCommand {
  constructor(
    public readonly id: string,
    public readonly sku: string,
    public readonly name: string,
    public readonly description: string,
    public readonly categoryId: string,
    public readonly brand: string,
    public readonly images: Array<{
      url: string;
      altText: string;
      displayOrder: number;
      isPrimary: boolean;
    }>,
    public readonly basePrice: number,
    public readonly currency: string = 'USD',
    public readonly minOrderQuantity: number = 1,
    public readonly maxOrderQuantity: number | null = null,
    public readonly tags: string[] = [],
  ) {
    super();
  }
}

