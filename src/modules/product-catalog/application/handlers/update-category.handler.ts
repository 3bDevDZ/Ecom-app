import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateCategoryCommand } from '../commands/update-category.command';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/aggregates/category';
import { Inject } from '@nestjs/common';

/**
 * UpdateCategoryCommandHandler
 *
 * Handles the UpdateCategoryCommand to update an existing category.
 */
@CommandHandler(UpdateCategoryCommand)
@Injectable()
export class UpdateCategoryCommandHandler implements ICommandHandler<UpdateCategoryCommand> {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(command: UpdateCategoryCommand): Promise<Category> {
    // Find existing category
    const category = await this.categoryRepository.findById(command.id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${command.id} not found`);
    }

    // Update details if provided
    if (command.name || command.description !== undefined) {
      category.updateDetails(command.name ?? category.name, command.description ?? category.description);
    }

    // Update display order if provided
    if (command.displayOrder !== undefined) {
      category.setDisplayOrder(command.displayOrder);
    }

    // Update active status if provided
    if (command.isActive !== undefined) {
      if (command.isActive) {
        category.activate();
      } else {
        category.deactivate();
      }
    }

    // Save updated category
    const savedCategory = await this.categoryRepository.save(category);

    return savedCategory;
  }
}

