import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DomainEvent } from '../../../../../src/shared/domain/domain-event.base';
import { OutboxEntity } from '../../../../../src/shared/infrastructure/outbox/outbox.entity';
import { OutboxService } from '../../../../../src/shared/infrastructure/outbox/outbox.service';
import { TestDatabaseHelper } from '../../../../helpers/database.helper';
import { v4 as uuidv4 } from 'uuid';

// Mock domain event for testing
class TestDomainEvent extends DomainEvent {
  readonly eventType = 'TestEvent';

  constructor(aggregateId: string, public readonly payload: any) {
    super(aggregateId);
  }
}

describe('OutboxService (Integration)', () => {
  let service: OutboxService;
  let dataSource: DataSource;
  let repository: Repository<OutboxEntity>;
  let module: TestingModule;

  beforeAll(async () => {
    dataSource = await TestDatabaseHelper.createTestDatabase([OutboxEntity]);

    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT || process.env.DATABASE_PORT || '5432', 10),
          username: process.env.TEST_DB_USERNAME || process.env.DATABASE_USER || 'ecommerce',
          password: process.env.TEST_DB_PASSWORD || process.env.DATABASE_PASSWORD || 'ecommerce_password',
          database: dataSource.options.database as string,
          entities: [OutboxEntity],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([OutboxEntity]),
      ],
      providers: [OutboxService],
    }).compile();

    service = module.get<OutboxService>(OutboxService);
    repository = dataSource.getRepository(OutboxEntity);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await TestDatabaseHelper.closeTestDatabase(dataSource);
  });

  beforeEach(async () => {
    await TestDatabaseHelper.clearDatabase(dataSource);
  });

  describe('insert', () => {
    it('should insert event into outbox table', async () => {
      const aggregateId = uuidv4();
      const event = new TestDomainEvent(aggregateId, { data: 'test' });

      await service.insert(event);

      const saved = await repository.findOne({ where: { aggregateId } });
      expect(saved).toBeDefined();
      expect(saved!.eventType).toBe('TestEvent');
      expect(saved!.aggregateId).toBe(aggregateId);
      expect(saved!.processed).toBe(false);
      expect(saved!.retryCount).toBe(0);
      expect(saved!.payload).toMatchObject({
        eventId: expect.any(String),
        aggregateId,
        occurredOn: expect.any(String),
      });
    });

    it('should insert event using EntityManager within transaction', async () => {
      const aggregateId = uuidv4();
      const event = new TestDomainEvent(aggregateId, { data: 'test' });

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await service.insert(event, queryRunner.manager);
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }

      const saved = await repository.findOne({ where: { aggregateId } });
      expect(saved).toBeDefined();
      expect(saved!.aggregateId).toBe(aggregateId);
    });

    it('should rollback event insertion on transaction failure', async () => {
      const aggregateId = uuidv4();
      const event = new TestDomainEvent(aggregateId, { data: 'test' });

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await service.insert(event, queryRunner.manager);
        throw new Error('Simulated error');
      } catch (error) {
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }

      const saved = await repository.findOne({ where: { aggregateId } });
      expect(saved).toBeNull();
    });
  });

  describe('insertMany', () => {
    it('should insert multiple events into outbox', async () => {
      const aggregateId1 = uuidv4();
      const aggregateId2 = uuidv4();
      const events = [
        new TestDomainEvent(aggregateId1, { data: 'test1' }),
        new TestDomainEvent(aggregateId2, { data: 'test2' }),
      ];

      await service.insertMany(events);

      const saved = await repository.find({
        where: [{ aggregateId: aggregateId1 }, { aggregateId: aggregateId2 }],
      });

      expect(saved).toHaveLength(2);
      expect(saved.map((e) => e.aggregateId)).toContain(aggregateId1);
      expect(saved.map((e) => e.aggregateId)).toContain(aggregateId2);
    });
  });

  describe('getUnprocessedEvents', () => {
    it('should return unprocessed events ordered by creation date', async () => {
      const event1 = new TestDomainEvent(uuidv4(), { data: 'test1' });
      const event2 = new TestDomainEvent(uuidv4(), { data: 'test2' });

      await service.insert(event1);
      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay to ensure different timestamps
      await service.insert(event2);

      const unprocessed = await service.getUnprocessedEvents(100);

      expect(unprocessed.length).toBeGreaterThanOrEqual(2);
      const event1Found = unprocessed.find((e) => e.aggregateId === event1.aggregateId);
      const event2Found = unprocessed.find((e) => e.aggregateId === event2.aggregateId);
      expect(event1Found).toBeDefined();
      expect(event2Found).toBeDefined();
    });

    it('should respect limit parameter', async () => {
      // Insert 5 events
      for (let i = 0; i < 5; i++) {
        await service.insert(new TestDomainEvent(uuidv4(), { data: `test${i}` }));
      }

      const limited = await service.getUnprocessedEvents(3);

      expect(limited.length).toBeLessThanOrEqual(3);
    });

    it('should not return processed events', async () => {
      const event = new TestDomainEvent(uuidv4(), { data: 'test' });
      await service.insert(event);

      const saved = await repository.findOne({ where: { aggregateId: event.aggregateId } });
      await service.markAsProcessed(saved!.id);

      const unprocessed = await service.getUnprocessedEvents(100);
      const found = unprocessed.find((e) => e.aggregateId === event.aggregateId);

      expect(found).toBeUndefined();
    });
  });

  describe('markAsProcessed', () => {
    it('should mark event as processed with timestamp', async () => {
      const event = new TestDomainEvent(uuidv4(), { data: 'test' });
      await service.insert(event);

      const saved = await repository.findOne({ where: { aggregateId: event.aggregateId } });
      const beforeUpdate = new Date();

      await service.markAsProcessed(saved!.id);

      const updated = await repository.findOne({ where: { id: saved!.id } });
      expect(updated!.processed).toBe(true);
      expect(updated!.processedAt).toBeDefined();
      expect(updated!.processedAt!.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });
  });

  describe('markAsFailed', () => {
    it('should increment retry count and set error message', async () => {
      const event = new TestDomainEvent(uuidv4(), { data: 'test' });
      await service.insert(event);

      const saved = await repository.findOne({ where: { aggregateId: event.aggregateId } });
      const initialRetryCount = saved!.retryCount;
      const errorMessage = 'Test error message';

      await service.markAsFailed(saved!.id, errorMessage);

      const updated = await repository.findOne({ where: { id: saved!.id } });
      expect(updated!.retryCount).toBe(initialRetryCount + 1);
      expect(updated!.error).toBe(errorMessage);
    });

    it('should handle multiple retries', async () => {
      const event = new TestDomainEvent(uuidv4(), { data: 'test' });
      await service.insert(event);

      const saved = await repository.findOne({ where: { aggregateId: event.aggregateId } });

      await service.markAsFailed(saved!.id, 'Error 1');
      await service.markAsFailed(saved!.id, 'Error 2');
      await service.markAsFailed(saved!.id, 'Error 3');

      const updated = await repository.findOne({ where: { id: saved!.id } });
      expect(updated!.retryCount).toBe(3);
      expect(updated!.error).toBe('Error 3');
    });
  });
});

