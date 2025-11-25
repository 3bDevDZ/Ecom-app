import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Identity Module (for JwtAuthGuard and KeycloakAuthService)
import { IdentityModule } from '../identity/identity.module';

// Entities
import {
  CategoryEntity,
  ProductEntity,
  ProductVariantEntity,
} from './infrastructure/persistence/entities';
import { ProductReadModel } from './infrastructure/persistence/read-models/product-read-model.entity';

// Repositories
import { CategoryRepository } from './infrastructure/persistence/repositories/category.repository';
import { ProductRepository } from './infrastructure/persistence/repositories/product.repository';

// Controllers - API
import { CategoryController } from './presentation/controllers/category.controller';
import { ProductController } from './presentation/controllers/product.controller';
// Controllers - Views
import { CategoryViewController } from './presentation/controllers/category-view.controller';
import { ProductViewController } from './presentation/controllers/product-view.controller';

// Command Handlers
import {
  CreateCategoryCommandHandler,
  CreateProductCommandHandler,
  DeleteCategoryCommandHandler,
  DeleteProductCommandHandler,
  UpdateCategoryCommandHandler,
  UpdateProductCommandHandler,
} from './application/handlers';

// Query Handlers
import {
  GetCategoriesQueryHandler,
  GetProductByIdQueryHandler,
  SearchProductsQueryHandler,
} from './application/handlers';

// Event Handlers
import {
  InventoryReleasedEventHandler,
  InventoryReservedEventHandler,
  ProductCreatedEventHandler,
  ProductUpdatedEventHandler,
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
    IdentityModule, // Required for JwtAuthGuard which needs KeycloakAuthService
    TypeOrmModule.forFeature([
      ProductEntity,
      ProductVariantEntity,
      CategoryEntity,
      ProductReadModel,
    ]),
  ],
  controllers: [
    // API Controllers (with /api prefix)
    ProductController,
    CategoryController,
    // View Controllers (without /api prefix, excluded from global prefix)
    ProductViewController,
    CategoryViewController,
  ],
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
export class ProductCatalogModule { }

