import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SearchProductsQuery } from '../queries/search-products.query';
import { ProductDto, ProductImageDto, ProductVariantDto } from '../dtos';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/aggregates/product';
import { PaginatedResponse } from '../../../../shared/application/pagination.dto';

/**
 * SearchProductsQueryHandler
 *
 * Handles the SearchProductsQuery to search and filter products.
 * Transforms domain entities to DTOs for the presentation layer.
 */
@QueryHandler(SearchProductsQuery)
export class SearchProductsQueryHandler implements IQueryHandler<SearchProductsQuery> {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(query: SearchProductsQuery): Promise<PaginatedResponse<ProductDto>> {
    let products: Product[];
    let total: number;

    // Handle different search scenarios
    if (query.searchTerm) {
      products = await this.productRepository.search(
        query.searchTerm,
        query.categoryId,
        query.skip,
        query.limit,
      );
      total = await this.productRepository.countSearch(query.searchTerm, query.categoryId);
    } else if (query.categoryId) {
      products = await this.productRepository.findByCategory(
        query.categoryId,
        query.skip,
        query.limit,
      );
      total = await this.productRepository.countByCategory(query.categoryId);
    } else if (query.brand) {
      products = await this.productRepository.findByBrand(query.brand, query.skip, query.limit);
      total = await this.productRepository.count();
    } else if (query.tags && query.tags.length > 0) {
      products = await this.productRepository.findByTags(query.tags, query.skip, query.limit);
      total = await this.productRepository.count();
    } else {
      products = await this.productRepository.findAll(query.skip, query.limit);
      total = await this.productRepository.count();
    }

    // Apply additional filters in memory (for MVP, this could be moved to repository later)
    if (query.isActive !== undefined) {
      products = products.filter(p => p.isActive === query.isActive);
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      products = products.filter(p => {
        const price = p.basePrice.amount;
        if (query.minPrice !== undefined && price < query.minPrice) return false;
        if (query.maxPrice !== undefined && price > query.maxPrice) return false;
        return true;
      });
    }

    // Transform to DTOs
    const productDtos = products.map(p => this.toDto(p));

    return new PaginatedResponse(productDtos, total, query.page, query.limit);
  }

  /**
   * Transform Product domain entity to ProductDto
   */
  private toDto(product: Product): ProductDto {
    const variants = product.variants.map(
      v =>
        new ProductVariantDto(
          v.id,
          v.sku.value,
          Object.fromEntries(v.attributes),
          v.priceDelta?.amount ?? null,
          v.priceDelta?.currency ?? product.basePrice.currency,
          v.inventory.availableQuantity,
          v.inventory.reservedQuantity,
          v.isActive,
        ),
    );

    // Calculate total available quantity from variants
    const totalAvailableQuantity = variants.reduce(
      (sum, v) => sum + v.availableQuantity,
      0,
    );

    return new ProductDto(
      product.id,
      product.sku.value,
      product.name,
      product.description,
      product.categoryId,
      product.brand,
      product.images.map(
        img => new ProductImageDto(img.url, img.altText, img.displayOrder, img.isPrimary),
      ),
      variants,
      product.basePrice.amount,
      product.basePrice.currency,
      product.minOrderQuantity,
      product.maxOrderQuantity,
      product.isActive,
      product.tags,
      product.createdAt,
      product.updatedAt,
      totalAvailableQuantity,
    );
  }
}
