import { BaseQuery } from '../../../../shared/application/base-query';

/**
 * GetProductByIdQuery
 *
 * Query to retrieve a single product by its unique identifier.
 * Returns the product with all variants, images, and related information.
 */
export class GetProductByIdQuery extends BaseQuery {
  constructor(public readonly productId: string) {
    super();
  }
}
