import { BaseQuery } from '../../../../shared/application/base-query';

/**
 * GetOrderHistoryQuery
 *
 * Query to retrieve order history for a specific user with pagination.
 * Returns a paginated list of orders sorted by creation date (newest first).
 */
export class GetOrderHistoryQuery extends BaseQuery {
  constructor(
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {
    super();
  }
}

