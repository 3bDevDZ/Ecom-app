import { BaseCommand } from '../../../../shared/application/base-command';

/**
 * DeleteCategoryCommand
 *
 * Command to delete a category.
 */
export class DeleteCategoryCommand extends BaseCommand {
  constructor(public readonly id: string) {
    super();
  }
}

