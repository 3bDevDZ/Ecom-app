import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add metadata fields to products table for specifications, documents, and reviews
 */
export class AddProductMetadataFields1732300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add specifications column (JSONB)
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "specifications" jsonb DEFAULT '{}'::jsonb
    `);

    // Add documents column (JSONB array)
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "documents" jsonb DEFAULT '[]'::jsonb
    `);

    // Add reviews column (JSONB array)
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "reviews" jsonb DEFAULT '[]'::jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN "reviews"
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN "documents"
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN "specifications"
    `);
  }
}

