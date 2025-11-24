import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Add cartId column to orders table
 *
 * The OrderEntity requires cartId but it was missing from the initial migration.
 * This migration adds the missing column.
 */
export class AddCartIdToOrders1732500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column already exists
        const table = await queryRunner.getTable('orders');
        const cartIdColumn = table?.findColumnByName('cartId');

        if (!cartIdColumn) {
            // First add as nullable
            await queryRunner.addColumn(
                'orders',
                new TableColumn({
                    name: 'cartId',
                    type: 'uuid',
                    isNullable: true,
                }),
            );

            // Update existing orders to have a placeholder cartId if needed
            // For now, we'll use a dummy UUID - in production, you'd want to handle this differently
            await queryRunner.query(`
        UPDATE "orders"
        SET "cartId" = gen_random_uuid()
        WHERE "cartId" IS NULL
      `);

            // Now make it NOT NULL
            await queryRunner.query(`
        ALTER TABLE "orders"
        ALTER COLUMN "cartId" SET NOT NULL
      `);
        }

        // Also add billingAddress if it doesn't exist (entity requires it)
        const billingAddressColumn = table?.findColumnByName('billingAddress');
        if (!billingAddressColumn) {
            // First add as nullable
            await queryRunner.addColumn(
                'orders',
                new TableColumn({
                    name: 'billingAddress',
                    type: 'jsonb',
                    isNullable: true,
                }),
            );

            // Copy shippingAddress to billingAddress for existing orders
            await queryRunner.query(`
        UPDATE "orders"
        SET "billingAddress" = "shippingAddress"::jsonb
        WHERE "billingAddress" IS NULL
      `);

            // Now make it NOT NULL
            await queryRunner.query(`
        ALTER TABLE "orders"
        ALTER COLUMN "billingAddress" SET NOT NULL
      `);
        }

        // Add cancellationReason if it doesn't exist
        const cancellationReasonColumn = table?.findColumnByName('cancellationReason');
        if (!cancellationReasonColumn) {
            await queryRunner.addColumn(
                'orders',
                new TableColumn({
                    name: 'cancellationReason',
                    type: 'varchar',
                    length: '500',
                    isNullable: true,
                }),
            );
        }

        // Add deliveredAt if it doesn't exist
        const deliveredAtColumn = table?.findColumnByName('deliveredAt');
        if (!deliveredAtColumn) {
            await queryRunner.addColumn(
                'orders',
                new TableColumn({
                    name: 'deliveredAt',
                    type: 'timestamp',
                    isNullable: true,
                }),
            );
        }

        // Add createdAt if it doesn't exist (entity has it)
        const createdAtColumn = table?.findColumnByName('createdAt');
        if (!createdAtColumn) {
            await queryRunner.addColumn(
                'orders',
                new TableColumn({
                    name: 'createdAt',
                    type: 'timestamp',
                    default: 'now()',
                    isNullable: false,
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove columns in reverse order
        const table = await queryRunner.getTable('orders');

        if (table?.findColumnByName('createdAt')) {
            await queryRunner.dropColumn('orders', 'createdAt');
        }
        if (table?.findColumnByName('deliveredAt')) {
            await queryRunner.dropColumn('orders', 'deliveredAt');
        }
        if (table?.findColumnByName('cancellationReason')) {
            await queryRunner.dropColumn('orders', 'cancellationReason');
        }
        if (table?.findColumnByName('billingAddress')) {
            await queryRunner.dropColumn('orders', 'billingAddress');
        }
        if (table?.findColumnByName('cartId')) {
            await queryRunner.dropColumn('orders', 'cartId');
        }
    }
}

