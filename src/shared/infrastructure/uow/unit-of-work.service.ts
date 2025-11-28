import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { OutboxService } from '../outbox/outbox.service';
import { UnitOfWorkContext } from './unit-of-work.context';

/**
 * Generic Unit of Work Service
 *
 * Provides transactional boundaries with automatic domain event collection.
 * Works with any entity type - not tied to specific aggregates.
 *
 * Features:
 * - Wraps operations in a database transaction
 * - Automatically collects domain events via TypeORM subscribers
 * - Persists events to outbox table within the same transaction
 * - Ensures atomicity: either all operations succeed or all rollback
 *
 * Usage:
 * ```typescript
 * await this.unitOfWork.execute(async (manager) => {
 *   const user = await userRepository.save(newUser, manager);
 *   // Events are automatically collected and saved to outbox
 * });
 * ```
 */
@Injectable()
export class UnitOfWorkService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly outboxService: OutboxService,
    ) { }

    /**
     * Execute work within a transaction
     * Automatically collects domain events and saves them to outbox
     *
     * @param work - Function that performs the work, receives EntityManager
     * @returns Result of the work function
     */
    async execute<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        // Create or get context for this transaction
        const context = UnitOfWorkContext.getOrCreate(queryRunner);
        context.clearEvents(); // Clear any previous events

        try {
            // Execute the work
            const result = await work(queryRunner.manager);

            // Collect and save events to outbox (within same transaction)
            if (context.pendingEvents.length > 0) {
                await this.outboxService.insertMany(context.pendingEvents, queryRunner.manager);
            }

            // Commit transaction
            await queryRunner.commitTransaction();

            return result;
        } catch (error) {
            // Rollback on error
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // Cleanup
            UnitOfWorkContext.remove(queryRunner);
            await queryRunner.release();
        }
    }

    /**
     * Start a new transaction manually
     * Returns a context that can be used to add events manually
     *
     * Use this when you need more control over the transaction lifecycle.
     * Remember to call commit() or rollback() manually.
     *
     * @returns Object with manager, context, commit, and rollback methods
     */
    async start(): Promise<{
        manager: EntityManager;
        context: UnitOfWorkContext;
        commit: () => Promise<void>;
        rollback: () => Promise<void>;
        release: () => Promise<void>;
    }> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        const context = UnitOfWorkContext.getOrCreate(queryRunner);
        context.clearEvents();

        return {
            manager: queryRunner.manager,
            context,
            commit: async () => {
                try {
                    // Save events to outbox before commit
                    if (context.pendingEvents.length > 0) {
                        await this.outboxService.insertMany(context.pendingEvents, queryRunner.manager);
                    }
                    await queryRunner.commitTransaction();
                } finally {
                    UnitOfWorkContext.remove(queryRunner);
                    await queryRunner.release();
                }
            },
            rollback: async () => {
                try {
                    await queryRunner.rollbackTransaction();
                } finally {
                    UnitOfWorkContext.remove(queryRunner);
                    await queryRunner.release();
                }
            },
            release: async () => {
                UnitOfWorkContext.remove(queryRunner);
                await queryRunner.release();
            },
        };
    }

    /**
     * Get the current active context for a QueryRunner
     * Useful for TypeORM subscribers to add events
     */
    static getContext(queryRunner: QueryRunner): UnitOfWorkContext | undefined {
        return UnitOfWorkContext.get(queryRunner);
    }
}

