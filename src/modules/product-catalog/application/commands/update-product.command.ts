import { BaseCommand } from '../../../../shared/application/base-command';

/**
 * UpdateProductCommand
 *
 * Command to update an existing product.
 */
export class UpdateProductCommand extends BaseCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly categoryId?: string,
    public readonly brand?: string,
    public readonly images?: Array<{
      url: string;
      altText: string;
      displayOrder: number;
      isPrimary: boolean;
    }>,
    public readonly basePrice?: number,
    public readonly currency?: string,
    public readonly minOrderQuantity?: number,
    public readonly maxOrderQuantity?: number | null,
    public readonly tags?: string[],
    public readonly isActive?: boolean,
  ) {
    super();
  }
}

