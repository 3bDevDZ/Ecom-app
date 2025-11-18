import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetProductByIdQuery } from '../queries/get-product-by-id.query';
import { ProductDto, ProductImageDto, ProductVariantDto } from '../dtos';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/aggregates/product';

/**
 * GetProductByIdQueryHandler
 *
 * Handles the GetProductByIdQuery to retrieve a single product by ID.
 * Transforms domain entity to DTO for the presentation layer.
 */
@QueryHandler(GetProductByIdQuery)
export class GetProductByIdQueryHandler implements IQueryHandler<GetProductByIdQuery> {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(query: GetProductByIdQuery): Promise<ProductDto> {
    const product = await this.productRepository.findById(query.productId);

    if (!product) {
      throw new NotFoundException(`Product with ID ${query.productId} not found`);
    }

    return this.toDto(product);
  }

  /**
   * Transform Product domain entity to ProductDto
   */
  private toDto(product: Product): ProductDto {
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
      product.variants.map(
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
      ),
      product.basePrice.amount,
      product.basePrice.currency,
      product.minOrderQuantity,
      product.maxOrderQuantity,
      product.isActive,
      product.tags,
      product.createdAt,
      product.updatedAt,
    );
  }
}
