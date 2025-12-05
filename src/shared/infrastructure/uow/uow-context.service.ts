import { Injectable, Scope } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { DataSource, QueryRunner } from 'typeorm';
import { EventBusService } from '../../event/event-bus.service';

/**
 * Unit of Work Context Service (Request-Scoped)
 *
 * Holds the current transaction's QueryRunner for the duration of a request.
 * This allows repositories to access the transaction context without
 * explicitly passing EntityManager through method parameters.
 *
 * This service is request-scoped, meaning each HTTP request gets its own
 * instance, ensuring transaction isolation between concurrent requests.
 */
@Injectable({ scope: Scope.REQUEST })
export class UnitOfWorkContextService {
    private queryRunner: QueryRunner | null = null;

    constructor(
        public readonly dataSource: DataSource,
        public readonly eventBus: EventBus,
        public readonly outboxEventBus: EventBusService,
    ) { }

    /**
     * Set the current QueryRunner for this request
     * Called by BaseRepository.save() when a transaction starts
     */
    setQueryRunner(queryRunner: QueryRunner): void {
        this.queryRunner = queryRunner;
    }

    /**
     * Get the current QueryRunner if available
     * Returns null if no transaction is active
     */
    getQueryRunner(): QueryRunner | null {
        return this.queryRunner;
    }

    /**
     * Clear the QueryRunner (called when transaction completes)
     */
    clear(): void {
        this.queryRunner = null;
    }

    /**
     * Check if a transaction is currently active
     */
    isTransactionActive(): boolean {
        return this.queryRunner !== null && this.queryRunner.isTransactionActive;
    }
}

