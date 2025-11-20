import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DeleteCategoryCommand } from '../commands/delete-category.command';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Inject } from '@nestjs/common';

/**
 * DeleteCategoryCommandHandler
 *
 * Handles the DeleteCategoryCommand to delete a category.
 */
@CommandHandler(DeleteCategoryCommand)
@Injectable()
export class DeleteCategoryCommandHandler implements ICommandHandler<DeleteCategoryCommand> {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(command: DeleteCategoryCommand): Promise<void> {
    // Check if category exists
    const category = await this.categoryRepository.findById(command.id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${command.id} not found`);
    }

    // Check if category has products
    const productCount = await this.productRepository.countByCategory(command.id);
    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete category with ID ${command.id} because it has ${productCount} product(s)`,
      );
    }

    // Check if category has subcategories
    const subcategories = await this.categoryRepository.findByParent(command.id);
    if (subcategories.length > 0) {
      throw new ConflictException(
        `Cannot delete category with ID ${command.id} because it has ${subcategories.length} subcategory(ies)`,
      );
    }

    // Delete category
    await this.categoryRepository.delete(command.id);
  }
}

