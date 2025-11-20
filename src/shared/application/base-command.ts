import { ICommand } from '@nestjs/cqrs';

/**
 * Base class for all Commands in the application layer
 *
 * Commands represent intentions to change state in the system.
 * They follow the Command pattern from CQRS.
 *
 * @example
 * export class CreateProductCommand extends BaseCommand {
 *   constructor(
 *     public readonly name: string,
 *     public readonly sku: string,
 *     public readonly price: number,
 *   ) {
 *     super();
 *   }
 * }
 */
export abstract class BaseCommand implements ICommand {
  /**
   * Timestamp when the command was created
   */
  public readonly timestamp: Date;

  constructor() {
    this.timestamp = new Date();
  }
}
