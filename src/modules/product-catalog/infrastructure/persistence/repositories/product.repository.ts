import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import { Product } from '../../../domain/aggregates/product';
import { ProductEntity } from '../entities/product.entity';
import { ProductMapper } from '../mappers/product.mapper';

/**
 * ProductRepository
 *
 * TypeORM implementation of IProductRepository.
 * Handles persistence operations for Product aggregates.
 */
@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repository: Repository<ProductEntity>,
  ) {}

  async findById(id: string): Promise<Product | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['variants'],
    });

    return entity ? ProductMapper.toDomain(entity) : null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const entity = await this.repository.findOne({
      where: { sku },
      relations: ['variants'],
    });

    return entity ? ProductMapper.toDomain(entity) : null;
  }

  async findByCategory(
    categoryId: string,
    skip?: number,
    take?: number,
  ): Promise<Product[]> {
    const entities = await this.repository.find({
      where: { categoryId },
      relations: ['variants'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return entities.map(e => ProductMapper.toDomain(e));
  }

  async search(
    searchTerm: string,
    categoryId?: string,
    skip?: number,
    take?: number,
  ): Promise<Product[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .where('product.name ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('product.description ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('product.tags @> :tag', { tag: JSON.stringify([searchTerm.toLowerCase()]) });

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    const entities = await queryBuilder
      .skip(skip)
      .take(take)
      .orderBy('product.createdAt', 'DESC')
      .getMany();

    return entities.map(e => ProductMapper.toDomain(e));
  }

  async findByBrand(brand: string, skip?: number, take?: number): Promise<Product[]> {
    const entities = await this.repository.find({
      where: { brand },
      relations: ['variants'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return entities.map(e => ProductMapper.toDomain(e));
  }

  async findByTags(tags: string[], skip?: number, take?: number): Promise<Product[]> {
    const normalizedTags = tags.map(t => t.toLowerCase());

    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .where('product.tags && :tags', { tags: normalizedTags });

    const entities = await queryBuilder
      .skip(skip)
      .take(take)
      .orderBy('product.createdAt', 'DESC')
      .getMany();

    return entities.map(e => ProductMapper.toDomain(e));
  }

  async findAll(skip?: number, take?: number): Promise<Product[]> {
    const entities = await this.repository.find({
      relations: ['variants'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return entities.map(e => ProductMapper.toDomain(e));
  }

  async save(product: Product): Promise<Product> {
    const entity = ProductMapper.toPersistence(product);
    const savedEntity = await this.repository.save(entity);
    return ProductMapper.toDomain(savedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async existsBySku(sku: string): Promise<boolean> {
    const count = await this.repository.count({ where: { sku } });
    return count > 0;
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  async countByCategory(categoryId: string): Promise<number> {
    return this.repository.count({ where: { categoryId } });
  }

  async countSearch(searchTerm: string, categoryId?: string): Promise<number> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .where('product.name ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('product.description ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .orWhere('product.tags @> :tag', { tag: JSON.stringify([searchTerm.toLowerCase()]) });

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    return queryBuilder.getCount();
  }
}
