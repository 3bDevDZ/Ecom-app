import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Update Cart Items Schema Migration
 *
 * Changes cart_items table from JSONB snapshot approach to flat columns
 * to match CartItemEntity structure:
 * - Remove: productSnapshot (jsonb), priceSnapshot (jsonb), variantId, addedAt
 * - Add: productName (varchar), sku (varchar), unitPrice (decimal), currency (varchar)
 */
export class UpdateCartItemsSchema1732600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns
    await queryRunner.query(`
      ALTER TABLE "cart_items"
      ADD COLUMN IF NOT EXISTS "productName" varchar(255),
      ADD COLUMN IF NOT EXISTS "sku" varchar(100),
      ADD COLUMN IF NOT EXISTS "unitPrice" decimal(10,2),
      ADD COLUMN IF NOT EXISTS "currency" varchar(3)
    `);

    // Migrate data from JSONB if it exists (for existing records)
    // Extract productName and sku from productSnapshot
    await queryRunner.query(`
      UPDATE "cart_items"
      SET
        "productName" = COALESCE("productSnapshot"->>'name', 'Unknown Product'),
        "sku" = COALESCE("productSnapshot"->>'sku', 'UNKNOWN'),
        "unitPrice" = COALESCE(CAST("priceSnapshot"->>'amount' AS decimal), 0),
        "currency" = COALESCE("priceSnapshot"->>'currency', 'USD')
      WHERE "productSnapshot" IS NOT NULL AND "priceSnapshot" IS NOT NULL
    `);

    // Set NOT NULL constraints after data migration
    await queryRunner.query(`
      ALTER TABLE "cart_items"
      ALTER COLUMN "productName" SET NOT NULL,
      ALTER COLUMN "sku" SET NOT NULL,
      ALTER COLUMN "unitPrice" SET NOT NULL,
      ALTER COLUMN "currency" SET NOT NULL
    `);

    // Drop old columns
    await queryRunner.query(`
      ALTER TABLE "cart_items"
      DROP COLUMN IF EXISTS "productSnapshot",
      DROP COLUMN IF EXISTS "priceSnapshot",
      DROP COLUMN IF EXISTS "variantId",
      DROP COLUMN IF EXISTS "addedAt"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back old columns
    await queryRunner.query(`
      ALTER TABLE "cart_items"
      ADD COLUMN IF NOT EXISTS "productSnapshot" jsonb,
      ADD COLUMN IF NOT EXISTS "priceSnapshot" jsonb,
      ADD COLUMN IF NOT EXISTS "variantId" uuid,
      ADD COLUMN IF NOT EXISTS "addedAt" timestamp DEFAULT now()
    `);

    // Migrate data back to JSONB format
    await queryRunner.query(`
      UPDATE "cart_items"
      SET
        "productSnapshot" = jsonb_build_object(
          'name', "productName",
          'sku', "sku",
          'productId', "productId"
        ),
        "priceSnapshot" = jsonb_build_object(
          'amount', "unitPrice",
          'currency', "currency"
        )
      WHERE "productName" IS NOT NULL
    `);

    // Set NOT NULL constraints
    await queryRunner.query(`
      ALTER TABLE "cart_items"
      ALTER COLUMN "productSnapshot" SET NOT NULL,
      ALTER COLUMN "priceSnapshot" SET NOT NULL
    `);

    // Drop new columns
    await queryRunner.query(`
      ALTER TABLE "cart_items"
      DROP COLUMN IF EXISTS "productName",
      DROP COLUMN IF EXISTS "sku",
      DROP COLUMN IF EXISTS "unitPrice",
      DROP COLUMN IF EXISTS "currency"
    `);
  }
}

