import { BaseQuery } from '../../../../shared/application/base-query';

/**
 * GetOrderByNumberQuery
 *
 * Query to retrieve a single order by its order number.
 * Includes user ID for authorization check.
 */
export class GetOrderByNumberQuery extends BaseQuery {
    constructor(
        public readonly orderNumber: string,
        public readonly userId: string,
    ) {
        super();
    }
}

