import { BaseCommand } from '../../../../shared/application/base-command';

/**
 * ReorderCommand
 *
 * Command to reorder items from a previous order.
 * Creates a new cart with items from the specified order.
 */
export class ReorderCommand extends BaseCommand {
  constructor(
    public readonly userId: string,
    public readonly orderId: string,
  ) {
    super();
  }
}

