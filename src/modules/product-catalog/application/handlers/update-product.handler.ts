import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateProductCommand } from '../commands/update-product.command';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { Product } from '../../domain/aggregates/product';
import { Money } from '../../domain/value-objects/money';
import { ProductImage } from '../../domain/value-objects/product-image';
import { Inject } from '@nestjs/common';

/**
 * UpdateProductCommandHandler
 *
 * Handles the UpdateProductCommand to update an existing product.
 */
@CommandHandler(UpdateProductCommand)
@Injectable()
export class UpdateProductCommandHandler implements ICommandHandler<UpdateProductCommand> {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(command: UpdateProductCommand): Promise<Product> {
    // Find existing product
    const product = await this.productRepository.findById(command.id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${command.id} not found`);
    }

    // Update details if provided
    if (command.name || command.description || command.categoryId || command.brand) {
      product.updateDetails(
        command.name ?? product.name,
        command.description ?? product.description,
        command.categoryId ?? product.categoryId,
        command.brand ?? product.brand,
      );
    }

    // Validate category if changed
    if (command.categoryId && command.categoryId !== product.categoryId) {
      const category = await this.categoryRepository.findById(command.categoryId);
      if (!category) {
        throw new NotFoundException(`Category with ID ${command.categoryId} not found`);
      }
    }

    // Update pricing if provided
    if (command.basePrice !== undefined) {
      const currency = command.currency ?? product.basePrice.currency;
      product.updatePricing(new Money(command.basePrice, currency));
    }

    // Update images if provided
    // Note: Product aggregate doesn't have image management methods yet
    // For now, images are set during creation. This would require adding
    // updateImages method to the Product aggregate in a future iteration.
    // if (command.images) {
    //   // Would need: product.updateImages(command.images.map(...))
    // }

    // Update order quantities if provided
    if (command.minOrderQuantity !== undefined || command.maxOrderQuantity !== undefined) {
      product.setOrderQuantities(
        command.minOrderQuantity ?? product.minOrderQuantity,
        command.maxOrderQuantity ?? product.maxOrderQuantity,
      );
    }

    // Update tags if provided
    if (command.tags) {
      // Get current tags as a copy
      const currentTags = [...product.tags];
      // Remove all existing tags
      currentTags.forEach(tag => product.removeTag(tag));
      // Add new tags
      command.tags.forEach(tag => product.addTag(tag));
    }

    // Update active status if provided
    if (command.isActive !== undefined) {
      if (command.isActive) {
        product.activate();
      } else {
        product.deactivate();
      }
    }

    // Save updated product
    const savedProduct = await this.productRepository.save(product);

    return savedProduct;
  }
}

