import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCategoriesQuery } from '../queries/get-categories.query';
import { CategoryDto } from '../dtos/category.dto';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Category } from '../../domain/aggregates/category';
import { PaginatedResponse } from '../../../../shared/application/pagination.dto';

/**
 * GetCategoriesQueryHandler
 *
 * Handles the GetCategoriesQuery to retrieve categories.
 * Supports hierarchical category retrieval and optional product counts.
 */
@QueryHandler(GetCategoriesQuery)
export class GetCategoriesQueryHandler implements IQueryHandler<GetCategoriesQuery> {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(query: GetCategoriesQuery): Promise<PaginatedResponse<CategoryDto>> {
    let categories: Category[];
    let total: number;

    if (query.parentId === null) {
      // Get root categories only
      categories = await this.categoryRepository.findRootCategories(query.skip, query.limit);
      total = await this.categoryRepository.count();
    } else if (query.parentId) {
      // Get categories with specific parent
      categories = await this.categoryRepository.findByParent(
        query.parentId,
        query.skip,
        query.limit,
      );
      total = await this.categoryRepository.countByParent(query.parentId);
    } else {
      // Get all categories
      if (query.isActive !== undefined) {
        categories = await this.categoryRepository.findActiveOrderedByDisplay(
          query.skip,
          query.limit,
        );
        total = await this.categoryRepository.count();
      } else {
        categories = await this.categoryRepository.findAll(query.skip, query.limit);
        total = await this.categoryRepository.count();
      }
    }

    // Apply active filter if specified
    if (query.isActive !== undefined) {
      categories = categories.filter(c => c.isActive === query.isActive);
    }

    // Transform to DTOs with product counts
    const categoryDtos = await Promise.all(categories.map(c => this.toDto(c)));

    return new PaginatedResponse(categoryDtos, total, query.page, query.limit);
  }

  /**
   * Transform Category domain entity to CategoryDto
   */
  private async toDto(category: Category): Promise<CategoryDto> {
    // Get product count for this category (optional optimization)
    const productCount = await this.productRepository.countByCategory(category.id);

    return new CategoryDto(
      category.id,
      category.name,
      category.slug,
      category.description,
      category.parentId,
      category.displayOrder,
      category.isActive,
      category.createdAt,
      category.updatedAt,
      productCount,
    );
  }
}
