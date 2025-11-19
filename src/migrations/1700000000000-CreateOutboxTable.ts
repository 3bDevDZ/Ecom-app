import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOutboxTable1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'outbox',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'eventType',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'aggregateId',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'aggregateType',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'payload',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'processed',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'processedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'retryCount',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'scheduledFor',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create index for efficient polling of unprocessed events
    await queryRunner.createIndex(
      'outbox',
      new TableIndex({
        name: 'IDX_OUTBOX_PROCESSED_CREATED',
        columnNames: ['processed', 'createdAt'],
      }),
    );

    // Create index for aggregate lookups
    await queryRunner.createIndex(
      'outbox',
      new TableIndex({
        name: 'IDX_OUTBOX_AGGREGATE',
        columnNames: ['aggregateType', 'aggregateId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('outbox', 'IDX_OUTBOX_AGGREGATE');
    await queryRunner.dropIndex('outbox', 'IDX_OUTBOX_PROCESSED_CREATED');
    await queryRunner.dropTable('outbox');
  }
}
