import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResponse } from '../../../../shared/application/pagination.dto';
import { Product } from '../../domain/aggregates/product';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { ProductDto, ProductImageDto, ProductVariantDto } from '../dtos';
import { SearchProductsQuery } from '../queries/search-products.query';

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
  ) { }

  async execute(query: SearchProductsQuery): Promise<PaginatedResponse<ProductDto>> {
    let products: Product[];
    let total: number;

    // Normalize arrays for filtering
    const categoryIds = Array.isArray(query.categoryId) ? query.categoryId : (query.categoryId ? [query.categoryId] : undefined);
    const brands = Array.isArray(query.brand) ? query.brand : (query.brand ? [query.brand] : undefined);

    // Start with search or all products
    if (query.searchTerm) {
      products = await this.productRepository.search(
        query.searchTerm,
        categoryIds?.[0], // Repository search supports single categoryId
        query.skip,
        query.limit * 2, // Get more products to filter
      );
      total = await this.productRepository.countSearch(query.searchTerm, categoryIds?.[0]);
    } else {
      products = await this.productRepository.findAll(query.skip, query.limit * 2);
      total = await this.productRepository.count();
    }

    // Apply AND filtering - all filters must match
    // Category filter (OR within categories - match any selected category)
    if (categoryIds && categoryIds.length > 0) {
      products = products.filter(p => categoryIds.includes(p.categoryId));
      total = products.length;
    }

    // Brand filter (OR within brands - match any selected brand)
    if (brands && brands.length > 0) {
      products = products.filter(p => p.brand && brands.includes(p.brand));
      total = products.length;
    }

    // Tags filter (OR within tags)
    if (query.tags && query.tags.length > 0) {
      products = products.filter(p =>
        p.tags && query.tags!.some(tag => p.tags.includes(tag))
      );
      total = products.length;
    }

    // Active status filter
    if (query.isActive !== undefined) {
      products = products.filter(p => p.isActive === query.isActive);
      total = products.length;
    }

    // Price range filter
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      products = products.filter(p => {
        const price = p.basePrice.amount;
        if (query.minPrice !== undefined && price < query.minPrice) return false;
        if (query.maxPrice !== undefined && price > query.maxPrice) return false;
        return true;
      });
      total = products.length;
    }

    // Apply pagination after filtering
    const skip = query.skip;
    const limit = query.limit;
    products = products.slice(skip, skip + limit);

    // Transform to DTOs
    let productDtos = products.map(p => this.toDto(p));

    // Apply sorting
    if (query.sortBy) {
      productDtos = this.sortProducts(productDtos, query.sortBy);
    }

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

  /**
   * Sort products based on sortBy option
   */
  private sortProducts(products: ProductDto[], sortBy: string): ProductDto[] {
    const sorted = [...products];

    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => {
          const priceA = a.priceRange?.min ?? a.basePrice;
          const priceB = b.priceRange?.min ?? b.basePrice;
          return priceA - priceB;
        });
        break;
      case 'price-high':
        sorted.sort((a, b) => {
          const priceA = a.priceRange?.max ?? a.basePrice;
          const priceB = b.priceRange?.max ?? b.basePrice;
          return priceB - priceA;
        });
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'best-match':
      default:
        // Best match: Keep original order (products from repository are already sorted by relevance)
        break;
    }

    return sorted;
  }
}
