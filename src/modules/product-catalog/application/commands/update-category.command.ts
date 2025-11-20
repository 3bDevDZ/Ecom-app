import { BaseCommand } from '../../../../shared/application/base-command';

/**
 * UpdateCategoryCommand
 *
 * Command to update an existing category.
 */
export class UpdateCategoryCommand extends BaseCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly description?: string | null,
    public readonly displayOrder?: number,
    public readonly isActive?: boolean,
  ) {
    super();
  }
}

