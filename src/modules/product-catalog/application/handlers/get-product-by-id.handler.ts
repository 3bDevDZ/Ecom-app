import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetProductByIdQuery } from '../queries/get-product-by-id.query';
import { ProductDto, ProductImageDto, ProductVariantDto } from '../dtos';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/aggregates/product';
import { ProductEntity } from '../../infrastructure/persistence/entities/product.entity';

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
    @InjectRepository(ProductEntity)
    private readonly productEntityRepository: Repository<ProductEntity>,
  ) {}

  async execute(query: GetProductByIdQuery): Promise<ProductDto> {
    const product = await this.productRepository.findById(query.productId);

    if (!product) {
      throw new NotFoundException(`Product with ID ${query.productId} not found`);
    }

    // Get entity to access metadata (specifications, documents, reviews)
    const entity = await this.productEntityRepository.findOne({
      where: { id: query.productId },
    });

    return this.toDto(product, entity);
  }

  /**
   * Transform Product domain entity to ProductDto
   */
  private toDto(product: Product, entity?: ProductEntity): ProductDto {
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
      entity?.specifications,
      entity?.documents,
      entity?.reviews,
    );
  }
}
