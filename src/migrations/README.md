# Database Migrations

This directory contains all database migrations for the B2B E-Commerce Platform.

## Migration Commands

### Generate a new migration
```bash
npm run migration:generate -- src/migrations/MigrationName
```

This will create a new migration file based on entity changes.

### Create an empty migration
```bash
npm run typeorm -- migration:create src/migrations/MigrationName
```

### Run pending migrations
```bash
npm run migration:run
```

### Revert the last migration
```bash
npm run migration:revert
```

### Show migration status
```bash
npm run typeorm -- migration:show -d src/config/typeorm.config.ts
```

## Migration Guidelines

1. **Never modify existing migrations** that have been run in production
2. **Always test migrations** locally before deploying
3. **Include both up and down methods** for reversibility
4. **Use transactions** when possible (TypeORM does this by default)
5. **Be careful with data migrations** - they can be slow on large tables
6. **Add indexes** after creating tables, not during table creation (for better performance)

## Migration Naming Convention

Use descriptive names with timestamp prefix (automatically added by TypeORM):
- `1234567890123-CreateProductsTable.ts`
- `1234567890124-AddCategoryIdToProducts.ts`
- `1234567890125-CreateIndexOnProductsSku.ts`

## Migration Order

Migrations will be created in this approximate order:

### Phase 2: Foundational
1. `CreateOutboxTable` - For event sourcing pattern
2. `CreateUserProfilesTable` - For identity context

### Phase 3: User Story 1 - Product Catalog
3. `CreateCategoriesTable` - Product categories
4. `CreateProductsTable` - Main products table
5. `CreateProductVariantsTable` - Product variants (size, color)
6. `CreateInventoryTable` - Inventory tracking
7. `CreateProductReadModelTable` - CQRS read model for queries
8. `AddIndexesForProductSearch` - Full-text search indexes

### Phase 4: User Story 2 - Cart & Checkout
9. `CreateCartsTable` - Shopping carts
10. `CreateCartItemsTable` - Cart line items
11. `CreateOrdersTable` - Orders
12. `CreateOrderItemsTable` - Order line items

### Phase 5: User Story 3 - Order History
13. `CreateOrderHistoryReadModelTable` - CQRS read model for order queries

### Phase 6: User Story 4 - Landing CMS
14. `CreateLandingPageContentTable` - CMS content storage

## Environment Variables

Ensure these are set in your `.env` file:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=b2b_ecommerce
DB_LOGGING=true
DB_SSL=false
```

## Troubleshooting

### Migration fails with "relation already exists"
- Check if the migration was partially applied
- Manually check the database and fix inconsistencies
- Use `migration:revert` to undo the last migration

### TypeORM can't find entities
- Ensure entity files have `.entity.ts` suffix
- Check that the entities path in `typeorm.config.ts` is correct

### Migration runs but changes aren't reflected
- Check that you're connecting to the correct database
- Verify `synchronize: false` in both TypeORM configs
- Ensure migrations ran successfully with `migration:show`
