import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ICategoryRepository } from '../../../domain/repositories/category.repository.interface';
import { Category } from '../../../domain/aggregates/category';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryMapper } from '../mappers/product.mapper';

/**
 * CategoryRepository
 *
 * TypeORM implementation of ICategoryRepository.
 * Handles persistence operations for Category aggregates.
 */
@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly repository: Repository<CategoryEntity>,
  ) {}

  async findById(id: string): Promise<Category | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? CategoryMapper.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const entity = await this.repository.findOne({ where: { slug } });
    return entity ? CategoryMapper.toDomain(entity) : null;
  }

  async findRootCategories(skip?: number, take?: number): Promise<Category[]> {
    const entities = await this.repository.find({
      where: { parentId: IsNull() },
      skip,
      take,
      order: { displayOrder: 'ASC', name: 'ASC' },
    });

    return entities.map(e => CategoryMapper.toDomain(e));
  }

  async findByParent(parentId: string, skip?: number, take?: number): Promise<Category[]> {
    const entities = await this.repository.find({
      where: { parentId },
      skip,
      take,
      order: { displayOrder: 'ASC', name: 'ASC' },
    });

    return entities.map(e => CategoryMapper.toDomain(e));
  }

  async findAll(skip?: number, take?: number): Promise<Category[]> {
    const entities = await this.repository.find({
      skip,
      take,
      order: { displayOrder: 'ASC', name: 'ASC' },
    });

    return entities.map(e => CategoryMapper.toDomain(e));
  }

  async findActiveOrderedByDisplay(skip?: number, take?: number): Promise<Category[]> {
    const entities = await this.repository.find({
      where: { isActive: true },
      skip,
      take,
      order: { displayOrder: 'ASC', name: 'ASC' },
    });

    return entities.map(e => CategoryMapper.toDomain(e));
  }

  async getCategoryPath(categoryId: string): Promise<Category[]> {
    const path: CategoryEntity[] = [];
    let currentId: string | null = categoryId;

    // Traverse up the hierarchy to build the path
    while (currentId) {
      const entity = await this.repository.findOne({ where: { id: currentId } });
      if (!entity) break;

      path.unshift(entity); // Add to beginning of array
      currentId = entity.parentId;
    }

    return path.map(e => CategoryMapper.toDomain(e));
  }

  async save(category: Category): Promise<Category> {
    const entity = CategoryMapper.toPersistence(category);
    const savedEntity = await this.repository.save(entity);
    return CategoryMapper.toDomain(savedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.repository.count({ where: { slug } });
    return count > 0;
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  async countByParent(parentId: string): Promise<number> {
    return this.repository.count({ where: { parentId } });
  }
}
