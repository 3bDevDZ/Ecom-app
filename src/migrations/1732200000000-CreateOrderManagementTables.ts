import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Create Order Management Tables Migration
 *
 * Creates tables for:
 * - carts: Shopping cart for users
 * - cart_items: Items in shopping carts
 * - orders: Placed orders
 * - order_items: Items within orders
 *
 * Supports User Story 2: Cart & Checkout
 */
export class CreateOrderManagementTables1732200000000 implements MigrationInterface {
    name = 'CreateOrderManagementTables1732200000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create carts table
        await queryRunner.query(`
      CREATE TABLE "carts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" varchar(255) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'active',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "expiresAt" timestamp NOT NULL,
        CONSTRAINT "PK_b5f695a59f5ebb50af3c8160816" PRIMARY KEY ("id")
      )
    `);

        // Create index on userId for fast cart lookup
        await queryRunner.query(`
      CREATE INDEX "IDX_carts_userId" ON "carts" ("userId")
    `);

        // Create index on status for filtering active carts
        await queryRunner.query(`
      CREATE INDEX "IDX_carts_status" ON "carts" ("status")
    `);

        // Create index on expiresAt for cleanup jobs
        await queryRunner.query(`
      CREATE INDEX "IDX_carts_expiresAt" ON "carts" ("expiresAt")
    `);

        // Create cart_items table
        await queryRunner.query(`
      CREATE TABLE "cart_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "cartId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "variantId" uuid,
        "productSnapshot" jsonb NOT NULL,
        "quantity" int NOT NULL,
        "priceSnapshot" jsonb NOT NULL,
        "addedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_6fccf5ec03c172d27a28a82928b" PRIMARY KEY ("id")
      )
    `);

        // Create index on cartId for fast item lookup
        await queryRunner.query(`
      CREATE INDEX "IDX_cart_items_cartId" ON "cart_items" ("cartId")
    `);

        // Create index on productId for inventory checks
        await queryRunner.query(`
      CREATE INDEX "IDX_cart_items_productId" ON "cart_items" ("productId")
    `);

        // Create orders table
        await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderNumber" varchar(50) NOT NULL,
        "userId" varchar(255) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "shippingAddress" jsonb NOT NULL,
        "poNumber" varchar(100),
        "notes" text,
        "subtotal" decimal(10,2) NOT NULL,
        "tax" decimal(10,2) NOT NULL DEFAULT 0,
        "shipping" decimal(10,2) NOT NULL DEFAULT 0,
        "discount" decimal(10,2),
        "total" decimal(10,2) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'USD',
        "placedAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        "cancelledAt" timestamp,
        "expectedDeliveryDate" timestamp,
        "trackingNumber" varchar(100),
        "trackingCarrier" varchar(50),
        CONSTRAINT "UQ_orders_orderNumber" UNIQUE ("orderNumber"),
        CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id")
      )
    `);

        // Create unique index on orderNumber
        await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_orders_orderNumber" ON "orders" ("orderNumber")
    `);

        // Create index on userId for user order history
        await queryRunner.query(`
      CREATE INDEX "IDX_orders_userId" ON "orders" ("userId")
    `);

        // Create index on status for filtering
        await queryRunner.query(`
      CREATE INDEX "IDX_orders_status" ON "orders" ("status")
    `);

        // Create index on placedAt for sorting
        await queryRunner.query(`
      CREATE INDEX "IDX_orders_placedAt" ON "orders" ("placedAt" DESC)
    `);

        // Create composite index for user order history queries
        await queryRunner.query(`
      CREATE INDEX "IDX_orders_userId_placedAt" ON "orders" ("userId", "placedAt" DESC)
    `);

        // Create order_items table
        await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "variantId" uuid,
        "sku" varchar(50) NOT NULL,
        "productName" varchar(200) NOT NULL,
        "variantAttributes" jsonb,
        "quantity" int NOT NULL,
        "unitPrice" decimal(10,2) NOT NULL,
        "subtotal" decimal(10,2) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'USD',
        "imageUrl" text,
        CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id")
      )
    `);

        // Create index on orderId for fast order item lookup
        await queryRunner.query(`
      CREATE INDEX "IDX_order_items_orderId" ON "order_items" ("orderId")
    `);

        // Create index on productId for product sales analytics
        await queryRunner.query(`
      CREATE INDEX "IDX_order_items_productId" ON "order_items" ("productId")
    `);

        // Add foreign key constraints
        await queryRunner.query(`
      ALTER TABLE "cart_items"
      ADD CONSTRAINT "FK_cart_items_cartId"
      FOREIGN KEY ("cartId") REFERENCES "carts"("id")
      ON DELETE CASCADE
    `);

        await queryRunner.query(`
      ALTER TABLE "cart_items"
      ADD CONSTRAINT "FK_cart_items_productId"
      FOREIGN KEY ("productId") REFERENCES "products"("id")
      ON DELETE RESTRICT
    `);

        await queryRunner.query(`
      ALTER TABLE "order_items"
      ADD CONSTRAINT "FK_order_items_orderId"
      FOREIGN KEY ("orderId") REFERENCES "orders"("id")
      ON DELETE CASCADE
    `);

        // Note: We don't add FK for order_items.productId because products might be deleted
        // but we want to keep historical order data
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_orderId"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_productId"`);
        await queryRunner.query(`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_cartId"`);

        // Drop tables in reverse order
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TABLE "cart_items"`);
        await queryRunner.query(`DROP TABLE "carts"`);
    }
}

