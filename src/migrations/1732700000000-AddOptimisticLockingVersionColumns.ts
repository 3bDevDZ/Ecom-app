import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add Optimistic Locking Version Columns Migration
 *
 * Adds version columns to carts and orders tables for optimistic concurrency control.
 * TypeORM will automatically increment the version on each update to detect concurrent modifications.
 */
export class AddOptimisticLockingVersionColumns1732700000000 implements MigrationInterface {
  name = 'AddOptimisticLockingVersionColumns1732700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add version column to carts table
    await queryRunner.query(`
      ALTER TABLE "carts"
      ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 0
    `);

    // Add version column to orders table
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 0
    `);

    // Create index on version for carts (optional, but can help with queries)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_carts_version" ON "carts" ("version")
    `);

    // Create index on version for orders (optional, but can help with queries)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_version" ON "orders" ("version")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_orders_version"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_carts_version"
    `);

    // Drop version columns
    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "version"
    `);

    await queryRunner.query(`
      ALTER TABLE "carts"
      DROP COLUMN IF EXISTS "version"
    `);
  }
}

