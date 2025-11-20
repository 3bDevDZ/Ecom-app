import { BaseCommand } from '../../../../shared/application/base-command';

/**
 * CreateCategoryCommand
 *
 * Command to create a new category.
 */
export class CreateCategoryCommand extends BaseCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string | null = null,
    public readonly parentId: string | null = null,
    public readonly displayOrder: number = 0,
  ) {
    super();
  }
}

