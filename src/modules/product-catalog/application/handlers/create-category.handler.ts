import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateCategoryCommand } from '../commands/create-category.command';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/aggregates/category';
import { Inject } from '@nestjs/common';

/**
 * CreateCategoryCommandHandler
 *
 * Handles the CreateCategoryCommand to create a new category.
 */
@CommandHandler(CreateCategoryCommand)
@Injectable()
export class CreateCategoryCommandHandler implements ICommandHandler<CreateCategoryCommand> {
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(command: CreateCategoryCommand): Promise<Category> {
    // Validate slug uniqueness
    const existingCategory = await this.categoryRepository.findBySlug(command.slug);
    if (existingCategory) {
      throw new ConflictException(`Category with slug ${command.slug} already exists`);
    }

    // Validate parent category exists if provided
    if (command.parentId) {
      const parentCategory = await this.categoryRepository.findById(command.parentId);
      if (!parentCategory) {
        throw new NotFoundException(`Parent category with ID ${command.parentId} not found`);
      }
    }

    // Create category aggregate
    const category = Category.create(
      command.id,
      command.name,
      command.slug,
      command.description,
      command.parentId,
    );

    // Set display order
    category.setDisplayOrder(command.displayOrder);

    // Save category
    const savedCategory = await this.categoryRepository.save(category);

    return savedCategory;
  }
}

