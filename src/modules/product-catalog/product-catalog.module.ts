import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import {
  ProductEntity,
  ProductVariantEntity,
  CategoryEntity,
} from './infrastructure/persistence/entities';
import { ProductReadModel } from './infrastructure/persistence/read-models/product-read-model.entity';

// Repositories
import { ProductRepository } from './infrastructure/persistence/repositories/product.repository';
import { CategoryRepository } from './infrastructure/persistence/repositories/category.repository';

// Controllers
import { ProductController } from './presentation/controllers/product.controller';
import { CategoryController } from './presentation/controllers/category.controller';

// Command Handlers
import {
  CreateProductCommandHandler,
  UpdateProductCommandHandler,
  DeleteProductCommandHandler,
  CreateCategoryCommandHandler,
  UpdateCategoryCommandHandler,
  DeleteCategoryCommandHandler,
} from './application/handlers';

// Query Handlers
import {
  SearchProductsQueryHandler,
  GetProductByIdQueryHandler,
  GetCategoriesQueryHandler,
} from './application/handlers';

// Event Handlers
import {
  ProductCreatedEventHandler,
  ProductUpdatedEventHandler,
  InventoryReservedEventHandler,
  InventoryReleasedEventHandler,
} from './infrastructure/events/product-event.handlers';

/**
 * Product Catalog Module (Bounded Context)
 * 
 * Responsibilities:
 * - Product management (CRUD, variants, categories)
 * - Product search and filtering (10K-50K products)
 * - Price management and bulk pricing
 * - Category hierarchy management
 * - Product availability tracking
 * - Read model optimization for search performance
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      ProductEntity,
      ProductVariantEntity,
      CategoryEntity,
      ProductReadModel,
    ]),
  ],
  controllers: [ProductController, CategoryController],
  providers: [
    // Repositories
    {
      provide: 'IProductRepository',
      useClass: ProductRepository,
    },
    {
      provide: 'ICategoryRepository',
      useClass: CategoryRepository,
    },
    // Command Handlers
    CreateProductCommandHandler,
    UpdateProductCommandHandler,
    DeleteProductCommandHandler,
    CreateCategoryCommandHandler,
    UpdateCategoryCommandHandler,
    DeleteCategoryCommandHandler,
    // Query Handlers
    SearchProductsQueryHandler,
    GetProductByIdQueryHandler,
    GetCategoriesQueryHandler,
    // Event Handlers
    ProductCreatedEventHandler,
    ProductUpdatedEventHandler,
    InventoryReservedEventHandler,
    InventoryReleasedEventHandler,
  ],
  exports: [
    'IProductRepository',
    'ICategoryRepository',
  ],
})
export class ProductCatalogModule {}

