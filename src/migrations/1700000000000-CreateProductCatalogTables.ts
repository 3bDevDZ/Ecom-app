import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration: Create Product Catalog Tables
 *
 * Creates the database schema for:
 * - categories: Product categories with hierarchical support
 * - products: Product catalog with pricing and inventory
 * - product_variants: Product variations with attributes
 */
export class CreateProductCatalogTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create categories table
    await queryRunner.createTable(
      new Table({
        name: 'categories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '200',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'parentId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'displayOrder',
            type: 'int',
            default: 0,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create indexes for categories
    await queryRunner.createIndex(
      'categories',
      new TableIndex({
        name: 'IDX_categories_slug',
        columnNames: ['slug'],
      }),
    );

    await queryRunner.createIndex(
      'categories',
      new TableIndex({
        name: 'IDX_categories_parentId',
        columnNames: ['parentId'],
      }),
    );

    await queryRunner.createIndex(
      'categories',
      new TableIndex({
        name: 'IDX_categories_isActive',
        columnNames: ['isActive'],
      }),
    );

    await queryRunner.createIndex(
      'categories',
      new TableIndex({
        name: 'IDX_categories_displayOrder',
        columnNames: ['displayOrder'],
      }),
    );

    // Create products table
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'sku',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'categoryId',
            type: 'uuid',
          },
          {
            name: 'brand',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'images',
            type: 'jsonb',
          },
          {
            name: 'basePrice',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'USD'",
          },
          {
            name: 'minOrderQuantity',
            type: 'int',
            default: 1,
          },
          {
            name: 'maxOrderQuantity',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'tags',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create indexes for products
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_sku',
        columnNames: ['sku'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_name',
        columnNames: ['name'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_categoryId',
        columnNames: ['categoryId'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_brand',
        columnNames: ['brand'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_isActive',
        columnNames: ['isActive'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_products_tags',
        columnNames: ['tags'],
      }),
    );

    // Create product_variants table
    await queryRunner.createTable(
      new Table({
        name: 'product_variants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'productId',
            type: 'uuid',
          },
          {
            name: 'sku',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'attributes',
            type: 'jsonb',
          },
          {
            name: 'priceDelta',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'USD'",
          },
          {
            name: 'availableQuantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'reservedQuantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create indexes for product_variants
    await queryRunner.createIndex(
      'product_variants',
      new TableIndex({
        name: 'IDX_product_variants_productId',
        columnNames: ['productId'],
      }),
    );

    await queryRunner.createIndex(
      'product_variants',
      new TableIndex({
        name: 'IDX_product_variants_sku',
        columnNames: ['sku'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'product_variants',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        columnNames: ['categoryId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'categories',
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const productsTable = await queryRunner.getTable('products');
    const productsForeignKey = productsTable?.foreignKeys.find(
      fk => fk.columnNames.indexOf('categoryId') !== -1,
    );
    if (productsForeignKey) {
      await queryRunner.dropForeignKey('products', productsForeignKey);
    }

    const variantsTable = await queryRunner.getTable('product_variants');
    const variantsForeignKey = variantsTable?.foreignKeys.find(
      fk => fk.columnNames.indexOf('productId') !== -1,
    );
    if (variantsForeignKey) {
      await queryRunner.dropForeignKey('product_variants', variantsForeignKey);
    }

    // Drop tables in reverse order
    await queryRunner.dropTable('product_variants');
    await queryRunner.dropTable('products');
    await queryRunner.dropTable('categories');
  }
}
