import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddReceiptUrlToOrders1732400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'orders',
      new TableColumn({
        name: 'receiptUrl',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('orders', 'receiptUrl');
  }
}

