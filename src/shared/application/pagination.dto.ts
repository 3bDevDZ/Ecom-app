import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for pagination parameters
 *
 * Provides standardized pagination across all queries.
 *
 * @example
 * // In a controller
 * @Get()
 * async findAll(@Query() pagination: PaginationDto) {
 *   return this.queryBus.execute(
 *     new GetProductsQuery(pagination.page, pagination.limit)
 *   );
 * }
 */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  get skip(): number {
    return (this.page! - 1) * this.limit!;
  }

  get take(): number {
    return this.limit!;
  }
}

/**
 * Response wrapper for paginated results
 *
 * @example
 * return new PaginatedResponse(
 *   products,
 *   total,
 *   pagination.page,
 *   pagination.limit
 * );
 */
export class PaginatedResponse<T> {
  constructor(
    public readonly data: T[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}

  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }

  get hasNextPage(): boolean {
    return this.page < this.totalPages;
  }

  get hasPreviousPage(): boolean {
    return this.page > 1;
  }
}
