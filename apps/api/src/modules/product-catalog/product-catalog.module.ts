import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

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
      // ProductEntity, CategoryEntity, ProductReadModel will be added later
    ]),
  ],
  controllers: [
    // ProductController, CategoryController will be added in T016/T017
  ],
  providers: [
    // Command handlers, query handlers, repositories will be added later
    // SearchService for optimized product search
  ],
  exports: [],
})
export class ProductCatalogModule {}

