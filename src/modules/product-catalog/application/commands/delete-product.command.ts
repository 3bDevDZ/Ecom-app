import { BaseCommand } from '../../../../shared/application/base-command';

/**
 * DeleteProductCommand
 *
 * Command to delete a product from the catalog.
 */
export class DeleteProductCommand extends BaseCommand {
  constructor(public readonly id: string) {
    super();
  }
}

