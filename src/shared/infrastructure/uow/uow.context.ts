import { EntityManager, QueryRunner } from 'typeorm';
import { DomainEvent } from '../../domain';

/**
 * Aggregate root interface for tracking aggregates in UoW
 * Any aggregate that implements getDomainEvents() and clearDomainEvents() can be tracked
 */
interface TrackableAggregate {
    getDomainEvents(): DomainEvent[];
    clearDomainEvents(): void;
}

/**
 * Get UnitOfWorkContext from EntityManager if available
 */
export function getUowContext(manager?: EntityManager): UnitOfWorkContext | null {
    if (!manager) {
        return null;
    }

    const queryRunner = (manager as any).queryRunner;
    if (!queryRunner) {
        return null;
    }

    return (queryRunner as any).__uowContext || null;
}

export class UnitOfWorkContext {
    private pendingEvents: DomainEvent[] = [];
    private trackedAggregates: Set<TrackableAggregate> = new Set();

    constructor(public readonly queryRunner: QueryRunner) { }

    /**
     * Track an aggregate for automatic event collection
     */
    track(aggregate: TrackableAggregate): void {
        this.trackedAggregates.add(aggregate);
    }

    /**
     * Collect all events from tracked aggregates
     */
    collectEvents(): void {
        for (const aggregate of this.trackedAggregates) {
            const events = aggregate.getDomainEvents();
            this.pendingEvents.push(...events);
            aggregate.clearDomainEvents();
        }
    }

    /**
     * Get all pending events (both manually added and collected from aggregates)
     */
    getPendingEvents(): DomainEvent[] {
        return [...this.pendingEvents];
    }

    /**
     * Manually add an event (for backward compatibility)
     */
    addEvent(event: DomainEvent) {
        this.pendingEvents.push(event);
    }

    /**
     * Clear all tracked data
     */
    clear(): void {
        this.pendingEvents = [];
        this.trackedAggregates.clear();
    }

    /**
     * @deprecated Use clear() instead
     */
    clearEvents() {
        this.clear();
    }
}
