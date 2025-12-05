import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { DomainEvent } from '../../../../../src/shared/domain/domain-event.base';
import { OutboxEntity } from '../../../../../src/shared/infrastructure/outbox/outbox.entity';
import { OutboxService } from '../../../../../src/shared/infrastructure/outbox/outbox.service';

// Mock domain event for testing
class TestDomainEvent extends DomainEvent {
  readonly eventType = 'TestEvent';

  constructor(aggregateId: string, public readonly payload: any) {
    super(aggregateId);
  }
}

describe('OutboxService', () => {
  let service: OutboxService;
  let repository: jest.Mocked<Repository<OutboxEntity>>;
  let entityManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const mockEntityManager = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxService,
        {
          provide: getRepositoryToken(OutboxEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<OutboxService>(OutboxService);
    repository = module.get(getRepositoryToken(OutboxEntity));
    entityManager = mockEntityManager as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('insert', () => {
    it('should insert event into outbox using default repository', async () => {
      const aggregateId = 'test-aggregate-id';
      const event = new TestDomainEvent(aggregateId, { data: 'test' });
      const mockOutboxEntity = {
        id: 'outbox-id',
        eventType: 'TestEvent',
        aggregateId,
        aggregateType: 'Test',
        payload: expect.any(Object),
        processed: false,
        retryCount: 0,
        createdAt: expect.any(Date),
      };

      repository.create.mockReturnValue(mockOutboxEntity as any);
      repository.save.mockResolvedValue(mockOutboxEntity as any);

      await service.insert(event);

      expect(repository.create).toHaveBeenCalled();
      const createCall = repository.create.mock.calls[0][0];
      expect(createCall.eventType).toBe('TestEvent');
      expect(createCall.aggregateId).toBe(aggregateId);
      expect(createCall.aggregateType).toBe('TestDomain'); // Extracted from "TestDomainEvent" class name
      expect(createCall.payload).toMatchObject({
        eventId: expect.any(String),
        aggregateId,
        occurredOn: expect.any(String),
      });
      expect(createCall.processed).toBe(false);
      expect(createCall.retryCount).toBe(0);
      expect(createCall.createdAt).toBeInstanceOf(Date);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should insert event using provided EntityManager', async () => {
      const aggregateId = 'test-aggregate-id';
      const event = new TestDomainEvent(aggregateId, { data: 'test' });
      const mockManagerRepo = {
        create: jest.fn(),
        save: jest.fn(),
      };
      const mockOutboxEntity = {
        id: 'outbox-id',
        eventType: 'TestEvent',
        aggregateId,
      };

      entityManager.getRepository.mockReturnValue(mockManagerRepo as any);
      mockManagerRepo.create.mockReturnValue(mockOutboxEntity);
      mockManagerRepo.save.mockResolvedValue(mockOutboxEntity);

      await service.insert(event, entityManager as any);

      expect(entityManager.getRepository).toHaveBeenCalledWith(OutboxEntity);
      expect(mockManagerRepo.create).toHaveBeenCalled();
      expect(mockManagerRepo.save).toHaveBeenCalled();
    });
  });

  describe('insertMany', () => {
    it('should insert multiple events into outbox', async () => {
      const aggregateId1 = 'aggregate-1';
      const aggregateId2 = 'aggregate-2';
      const events = [
        new TestDomainEvent(aggregateId1, { data: 'test1' }),
        new TestDomainEvent(aggregateId2, { data: 'test2' }),
      ];

      const mockEntities = events.map((event, index) => ({
        id: `outbox-id-${index}`,
        eventType: 'TestEvent',
        aggregateId: event.aggregateId,
      }));

      repository.create.mockImplementation((entity) => entity as any);
      repository.save.mockResolvedValue(mockEntities as any);

      await service.insertMany(events);

      expect(repository.create).toHaveBeenCalledTimes(2);
      expect(repository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            eventType: expect.any(String),
            aggregateId: aggregateId1,
            processed: false,
          }),
          expect.objectContaining({
            eventType: expect.any(String),
            aggregateId: aggregateId2,
            processed: false,
          }),
        ]),
      );
    });
  });

  describe('getUnprocessedEvents', () => {
    it('should return unprocessed events ordered by creation date', async () => {
      const mockEvents: OutboxEntity[] = [
        {
          id: '1',
          eventType: 'TestEvent1',
          aggregateId: 'agg-1',
          aggregateType: 'Test',
          payload: {},
          processed: false,
          processedAt: null,
          retryCount: 0,
          error: null,
          createdAt: new Date('2024-01-01'),
          scheduledFor: null,
        },
        {
          id: '2',
          eventType: 'TestEvent2',
          aggregateId: 'agg-2',
          aggregateType: 'Test',
          payload: {},
          processed: false,
          processedAt: null,
          retryCount: 0,
          error: null,
          createdAt: new Date('2024-01-02'),
          scheduledFor: null,
        },
      ];

      repository.find.mockResolvedValue(mockEvents);

      const result = await service.getUnprocessedEvents(100);

      expect(repository.find).toHaveBeenCalledWith({
        where: { processed: false },
        order: { createdAt: 'ASC' },
        take: 100,
      });
      expect(result).toEqual(mockEvents);
    });

    it('should respect limit parameter', async () => {
      repository.find.mockResolvedValue([]);

      await service.getUnprocessedEvents(50);

      expect(repository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });
  });

  describe('markAsProcessed', () => {
    it('should mark event as processed with timestamp', async () => {
      const eventId = 'outbox-id';
      const beforeUpdate = Date.now();

      repository.update.mockResolvedValue({ affected: 1 } as any);

      await service.markAsProcessed(eventId);

      expect(repository.update).toHaveBeenCalledWith(
        eventId,
        expect.objectContaining({
          processed: true,
          processedAt: expect.any(Date),
        }),
      );

      const updateCall = repository.update.mock.calls[0];
      const processedAt = updateCall[1].processedAt as Date;
      expect(processedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate);
    });
  });

  describe('markAsFailed', () => {
    it('should increment retry count and set error message', async () => {
      const eventId = 'outbox-id';
      const errorMessage = 'Test error message';
      const existingEntity: OutboxEntity = {
        id: eventId,
        eventType: 'TestEvent',
        aggregateId: 'agg-1',
        aggregateType: 'Test',
        payload: {},
        processed: false,
        processedAt: null,
        retryCount: 2,
        error: null,
        createdAt: new Date(),
        scheduledFor: null,
      };

      repository.findOne.mockResolvedValue(existingEntity);
      repository.save.mockResolvedValue({
        ...existingEntity,
        retryCount: 3,
        error: errorMessage,
      } as any);

      await service.markAsFailed(eventId, errorMessage);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: eventId } });
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          retryCount: 3,
          error: errorMessage,
        }),
      );
    });

    it('should handle case when event not found', async () => {
      const eventId = 'non-existent-id';
      const errorMessage = 'Test error';

      repository.findOne.mockResolvedValue(null);

      await service.markAsFailed(eventId, errorMessage);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: eventId } });
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});

