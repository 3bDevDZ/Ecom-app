import { QueryRunner } from 'typeorm';
import { DomainEvent } from '../../domain/domain-event.base';

/**
 * Unit of Work Context
 *
 * Provides a context for collecting domain events during a transaction.
 * This context is used by TypeORM subscribers to automatically collect
 * events when entities are saved.
 *
 * The context is stored in a WeakMap keyed by QueryRunner to allow
 * multiple concurrent transactions.
 */
export class UnitOfWorkContext {
    /**
     * Pending domain events collected during this transaction
     */
    public readonly pendingEvents: DomainEvent[] = [];

    /**
     * Static registry of active contexts
     * Uses WeakMap to allow garbage collection when QueryRunner is released
     */
    private static readonly contexts = new WeakMap<QueryRunner, UnitOfWorkContext>();

    constructor(public readonly queryRunner: QueryRunner) { }

    /**
     * Add a domain event to the context
     */
    public addEvent(event: DomainEvent): void {
        this.pendingEvents.push(event);
    }

    /**
     * Add multiple domain events to the context
     */
    public addEvents(events: DomainEvent[]): void {
        this.pendingEvents.push(...events);
    }

    /**
     * Clear all pending events (useful for rollback scenarios)
     */
    public clearEvents(): void {
        this.pendingEvents.length = 0;
    }

    /**
     * Get or create a context for a QueryRunner
     */
    public static getOrCreate(queryRunner: QueryRunner): UnitOfWorkContext {
        let context = this.contexts.get(queryRunner);
        if (!context) {
            context = new UnitOfWorkContext(queryRunner);
            this.contexts.set(queryRunner, context);
        }
        return context;
    }

    /**
     * Get context for a QueryRunner (returns undefined if not found)
     */
    public static get(queryRunner: QueryRunner): UnitOfWorkContext | undefined {
        return this.contexts.get(queryRunner);
    }

    /**
     * Remove context for a QueryRunner (cleanup after transaction)
     */
    public static remove(queryRunner: QueryRunner): void {
        this.contexts.delete(queryRunner);
    }
}

