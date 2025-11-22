import { BaseQuery } from '../../../../shared/application/base-query';

/**
 * GetOrderByIdQuery
 *
 * Query to retrieve a single order by its ID.
 * Includes user ID for authorization check.
 */
export class GetOrderByIdQuery extends BaseQuery {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
  ) {
    super();
  }
}

