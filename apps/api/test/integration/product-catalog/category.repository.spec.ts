import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryRepository } from '../../../src/modules/product-catalog/infrastructure/persistence/repositories/category.repository';
import { CategoryEntity } from '../../../src/modules/product-catalog/infrastructure/persistence/entities/category.entity';
import { TestDatabaseHelper } from '../../helpers/database.helper';
import { Category } from '../../../src/modules/product-catalog/domain/aggregates/category';

describe('CategoryRepository (Integration)', () => {
  let dataSource: DataSource;
  let repository: CategoryRepository;

  beforeAll(async () => {
    dataSource = await TestDatabaseHelper.createTestDatabase([CategoryEntity]);
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ ...(dataSource.options as any) }),
        TypeOrmModule.forFeature([CategoryEntity]),
      ],
      providers: [CategoryRepository],
    }).compile();

    repository = module.get<CategoryRepository>(CategoryRepository);
  });

  afterAll(async () => {
    await TestDatabaseHelper.closeTestDatabase(dataSource);
  });

  afterEach(async () => {
    await TestDatabaseHelper.clearDatabase(dataSource);
  });

  it('should save and retrieve a category', async () => {
    const category = Category.create('cat-1', 'Electronics', 'electronics', 'Electronic devices');
    await repository.save(category);

    const found = await repository.findById('cat-1');
    expect(found?.name).toBe('Electronics');
  });

  it('should find category by slug', async () => {
    const category = Category.create('cat-1', 'Electronics', 'electronics', 'Electronic devices');
    await repository.save(category);

    const found = await repository.findBySlug('electronics');
    expect(found?.id).toBe('cat-1');
  });

  it('should find subcategories', async () => {
    const parent = Category.create('cat-1', 'Electronics', 'electronics', 'Desc');
    const child = Category.create('cat-2', 'Laptops', 'laptops', 'Desc', 'cat-1');

    await repository.save(parent);
    await repository.save(child);

    const children = await repository.findByParent('cat-1');
    expect(children).toHaveLength(1);
    expect(children[0].name).toBe('Laptops');
  });
});
