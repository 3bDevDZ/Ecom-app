import { IQuery } from '@nestjs/cqrs';

/**
 * Base class for all Queries in the application layer
 *
 * Queries represent requests for data without changing state.
 * They follow the Query pattern from CQRS.
 *
 * @example
 * export class GetProductByIdQuery extends BaseQuery {
 *   constructor(public readonly productId: string) {
 *     super();
 *   }
 * }
 */
export abstract class BaseQuery implements IQuery {
  /**
   * Timestamp when the query was created
   */
  public readonly timestamp: Date;

  constructor() {
    this.timestamp = new Date();
  }
}
