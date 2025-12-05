import { ConflictException, Injectable, Scope } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { DataSource, EntityManager, OptimisticLockVersionMismatchError, QueryRunner, Repository } from 'typeorm';
import { DomainEvent } from '../../domain/domain-event.base';
import { EventBusService } from '../../event/event-bus.service';
import { UnitOfWorkContextService } from '../uow/uow-context.service';
import { UnitOfWorkContext } from '../uow/uow.context';

/**
 * Base Repository
 *
 * Provides common functionality for all repositories:
 * - Automatic transaction management in save() method
 * - Helper methods to get repositories using transaction EntityManager
 * - Automatic aggregate tracking and domain event publishing
 *
 * All repositories should extend this base class to ensure
 * consistent transaction handling across the application.
 *
 * @template TEntity - The TypeORM entity type
 * @template TAggregate - The domain aggregate type
 */
@Injectable({ scope: Scope.REQUEST })
export abstract class BaseRepository<TEntity, TAggregate> {
  constructor(
    protected readonly dataSource: DataSource,
    protected readonly uowContextService: UnitOfWorkContextService,
    protected readonly eventBus: EventBus,
    protected readonly outboxEventBus: EventBusService,
  ) { }

  /**
   * Save an aggregate with automatic transaction management
   *
   * This method:
   * 1. Starts a transaction (or uses existing if already in one)
   * 2. Calls doSave() to persist the entity (implemented by subclasses)
   * 3. Tracks the aggregate for event collection
   * 4. Collects domain events from tracked aggregates
   * 5. Dispatches events via NestJS CQRS EventBus (synchronously)
   * 6. Saves events to outbox (for async publishing)
   * 7. Commits the transaction (if we started it)
   *
   * If an error occurs, the transaction is rolled back.
   *
   * If already in a transaction (e.g., called from an EventBus handler),
   * it reuses the existing transaction instead of starting a new one.
   */
  async save(aggregate: TAggregate): Promise<void> {
    // Check if we're already in a transaction (e.g., called from EventBus handler)
    // This is NOT a nested transaction - we're reusing the existing transaction
    const existingQueryRunner = this.uowContextService.getQueryRunner();
    const isInExistingTransaction = existingQueryRunner !== null && existingQueryRunner.isTransactionActive;

    let queryRunner: QueryRunner;
    let uow: UnitOfWorkContext;
    let shouldCommit = false;

    if (isInExistingTransaction) {
      // Reuse existing transaction (participate in it)
      // This ensures all operations are atomic within the same transaction
      queryRunner = existingQueryRunner!;
      uow = this.getUowContext() || new UnitOfWorkContext(queryRunner);
      // Don't commit - let the outer transaction handle it
      shouldCommit = false;
    } else {
      // Start new transaction
      queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      uow = new UnitOfWorkContext(queryRunner);
      // Store UoW context in QueryRunner metadata
      (queryRunner as any).__uowContext = uow;
      // Store queryRunner in request-scoped service for repository access
      this.uowContextService.setQueryRunner(queryRunner);
      shouldCommit = true;
    }

    try {
      // 1. Persist the entity (implemented by subclass)
      await this.doSave(aggregate, queryRunner.manager);

      // 2. Track aggregate for event collection
      // This allows events to be collected later when the transaction commits
      if (this.isTrackableAggregate(aggregate)) {
        uow.track(aggregate);
      }

      // 3. Only collect, publish, and save to outbox if we're the transaction starter
      // This prevents duplicate event publishing when multiple handlers save different aggregates
      // in the same transaction (e.g., OrderPlaced -> CartConverterHandler saves Cart)
      if (shouldCommit) {
        const entityManager = queryRunner.manager;

        // 4. Collect events from all tracked aggregates (Order, etc.)
        uow.collectEvents();
        let eventsToPublish = uow.getPendingEvents();
        const allEvents: DomainEvent[] = [...eventsToPublish];

        // 5. Publish events (handlers run synchronously)
        // Handlers that save aggregates will track them in the same UoW context
        for (const event of eventsToPublish) {
          this.eventBus.publish(event);
        }

        // 6. After handlers complete, collect events from any aggregates they saved
        // (e.g., if Cart.convert() emitted CartConverted event)
        // Note: collectEvents() clears events from aggregates, so we need to call it again
        // to get events from newly tracked aggregates
        uow.collectEvents();
        const newEvents = uow.getPendingEvents();
        allEvents.push(...newEvents);

        // 7. Save all collected events to outbox IN SAME TRANSACTION (for async publishing)
        for (const event of allEvents) {
          await this.outboxEventBus.publish(event, entityManager);
        }

        // 8. Commit transaction
        await queryRunner.commitTransaction();
      }
      // If we're in an existing transaction, we just track the aggregate
      // The outer transaction will handle event collection, publishing, and outbox saving
    } catch (error) {
      if (shouldCommit) {
        await queryRunner.rollbackTransaction();
      }

      // Handle optimistic lock version mismatch
      if (error instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException(
          'The resource was modified by another operation. Please refresh and try again.',
        );
      }

      throw error;
    } finally {
      if (shouldCommit) {
        uow.clear();
        this.uowContextService.clear();
        delete (queryRunner as any).__uowContext;
        await queryRunner.release();
      } else {
        // For operations within existing transaction, only clear events, don't clear the context
        // The outer transaction will handle cleanup
        uow.clear();
      }
    }
  }

  /**
   * Abstract method to persist the entity
   * Must be implemented by subclasses to define entity-specific persistence logic
   */
  protected abstract doSave(aggregate: TAggregate, manager: EntityManager): Promise<void>;

  /**
   * Get the current EntityManager
   * Returns the transaction's EntityManager if a transaction is active,
   * otherwise returns the default DataSource manager
   */
  protected getEntityManager(): EntityManager {
    const queryRunner = this.uowContextService.getQueryRunner();
    return queryRunner?.manager || this.dataSource.manager;
  }

  /**
   * Get a repository for the given entity using the current transaction context
   * This ensures all operations use the same transaction
   */
  protected getRepository<T>(entity: new () => T): Repository<T> {
    const manager = this.getEntityManager();
    return manager.getRepository(entity);
  }

  /**
   * Get the UnitOfWorkContext if available
   * Used for tracking aggregates for domain event collection
   */
  protected getUowContext(): UnitOfWorkContext | null {
    const manager = this.getEntityManager();
    const queryRunner = (manager as any).queryRunner;
    if (!queryRunner) {
      return null;
    }
    return (queryRunner as any).__uowContext || null;
  }

  /**
   * Check if an aggregate is trackable (has getDomainEvents method)
   */
  protected isTrackableAggregate(aggregate: any): aggregate is { getDomainEvents(): DomainEvent[]; clearDomainEvents(): void } {
    return (
      aggregate &&
      typeof aggregate.getDomainEvents === 'function' &&
      typeof aggregate.clearDomainEvents === 'function'
    );
  }

  /**
   * Check if a transaction is currently active
   */
  protected isInTransaction(): boolean {
    return this.uowContextService.isTransactionActive();
  }
}
