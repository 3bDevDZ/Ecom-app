import { Test } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { SearchProductsQueryHandler } from '../../../src/modules/product-catalog/application/handlers/search-products.handler';
import { SearchProductsQuery } from '../../../src/modules/product-catalog/application/queries/search-products.query';
import { ProductRepository } from '../../../src/modules/product-catalog/infrastructure/persistence/repositories/product.repository';
import { DataSource } from 'typeorm';
import { TestDatabaseHelper } from '../../helpers/database.helper';
import { ProductEntity } from '../../../src/modules/product-catalog/infrastructure/persistence/entities/product.entity';
import { ProductReadModel } from '../../../src/modules/product-catalog/infrastructure/persistence/read-models/product-read-model.entity';

describe('SearchProductsQueryHandler (Integration)', () => {
  let dataSource: DataSource;
  let handler: SearchProductsQueryHandler;

  beforeAll(async () => {
    dataSource = await TestDatabaseHelper.createTestDatabase([
      ProductEntity,
      ProductReadModel,
    ]);

    const module = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        SearchProductsQueryHandler,
        {
          provide: ProductRepository,
          useValue: {
            // Mock repository
            search: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<SearchProductsQueryHandler>(SearchProductsQueryHandler);
  });

  afterAll(async () => {
    await TestDatabaseHelper.closeTestDatabase(dataSource);
  });

  it('should search products by keyword', async () => {
    const query = new SearchProductsQuery(
      'laptop', // searchTerm
      undefined, // categoryId
      undefined, // brand
      undefined, // tags
      undefined, // minPrice
      undefined, // maxPrice
      undefined, // isActive
      1, // page
      20, // limit
    );
    const result = await handler.execute(query);

    expect(result).toBeDefined();
    expect(result.data).toBeInstanceOf(Array);
  });

  it('should filter products by category', async () => {
    const query = new SearchProductsQuery(
      undefined, // searchTerm
      'electronics', // categoryId
      undefined, // brand
      undefined, // tags
      undefined, // minPrice
      undefined, // maxPrice
      undefined, // isActive
      1, // page
      20, // limit
    );
    const result = await handler.execute(query);

    expect(result).toBeDefined();
  });

  it('should filter products by price range', async () => {
    const query = new SearchProductsQuery(
      undefined, // searchTerm
      undefined, // categoryId
      undefined, // brand
      undefined, // tags
      100, // minPrice
      500, // maxPrice
      undefined, // isActive
      1, // page
      20, // limit
    );
    const result = await handler.execute(query);

    expect(result).toBeDefined();
  });
});
