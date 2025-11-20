import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateProductCommand } from '../commands/create-product.command';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { Product } from '../../domain/aggregates/product';
import { SKU } from '../../domain/value-objects/sku';
import { Money } from '../../domain/value-objects/money';
import { ProductImage } from '../../domain/value-objects/product-image';
import { Inject } from '@nestjs/common';

/**
 * CreateProductCommandHandler
 *
 * Handles the CreateProductCommand to create a new product.
 */
@CommandHandler(CreateProductCommand)
@Injectable()
export class CreateProductCommandHandler implements ICommandHandler<CreateProductCommand> {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(command: CreateProductCommand): Promise<Product> {
    // Validate SKU uniqueness
    const skuExists = await this.productRepository.existsBySku(command.sku);
    if (skuExists) {
      throw new ConflictException(`Product with SKU ${command.sku} already exists`);
    }

    // Validate category exists
    const category = await this.categoryRepository.findById(command.categoryId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${command.categoryId} not found`);
    }

    // Create product aggregate
    const product = Product.create(
      command.id,
      new SKU(command.sku),
      command.name,
      command.description,
      command.categoryId,
      command.brand,
      command.images.map(
        img => new ProductImage(img.url, img.altText, img.displayOrder, img.isPrimary),
      ),
      new Money(command.basePrice, command.currency),
    );

    // Set order quantities
    if (command.minOrderQuantity !== undefined || command.maxOrderQuantity !== undefined) {
      product.setOrderQuantities(command.minOrderQuantity, command.maxOrderQuantity);
    }

    // Add tags
    command.tags.forEach(tag => product.addTag(tag));

    // Save product
    const savedProduct = await this.productRepository.save(product);

    return savedProduct;
  }
}

