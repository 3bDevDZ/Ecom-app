import { Logger } from '@nestjs/common';
import {
    DataSource,
    EntitySubscriberInterface,
    EventSubscriber,
    InsertEvent,
    RemoveEvent,
    UpdateEvent,
} from 'typeorm';
import { AggregateRoot } from '../../domain/aggregate-root.base';
import { DomainEvent } from '../../domain/domain-event.base';
import { Entity } from '../../domain/entity.base';
import { UnitOfWorkContext } from '../uow/unit-of-work.context';

/**
 * Entity Change Subscriber
 *
 * Automatically detects entity changes and collects domain events.
 * Works with any entity extending AggregateRoot or Entity base classes.
 *
 * This subscriber:
 * 1. Listens to Insert, Update, and Remove events
 * 2. Detects what fields changed (for updates)
 * 3. Collects domain events from aggregates
 * 4. Adds events to the current UnitOfWorkContext
 *
 * The events are then persisted to the outbox table by UnitOfWorkService
 * within the same transaction.
 */
@EventSubscriber()
export class EntityChangeSubscriber implements EntitySubscriberInterface {
    private readonly logger = new Logger(EntityChangeSubscriber.name);

    constructor(dataSource?: DataSource) {
        // If dataSource is provided, register this subscriber
        // Otherwise, it will be registered via TypeORM configuration
        if (dataSource) {
            dataSource.subscribers.push(this);
        }
    }

    /**
     * Called after an entity is inserted
     */
    async afterInsert(event: InsertEvent<any>): Promise<void> {
        await this.handleEntityChange(event.entity, 'insert', event);
    }

    /**
     * Called after an entity is updated
     */
    async afterUpdate(event: UpdateEvent<any>): Promise<void> {
        await this.handleEntityChange(event.entity, 'update', event);
    }

    /**
     * Called after an entity is removed
     */
    async afterRemove(event: RemoveEvent<any>): Promise<void> {
        await this.handleEntityChange(event.entity, 'remove', event);
    }

    /**
     * Handle entity change and collect domain events
     */
    private async handleEntityChange(
        entity: any,
        operation: 'insert' | 'update' | 'remove',
        event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>,
    ): Promise<void> {
        if (!entity) {
            return;
        }

        // Check if entity extends our base classes or has domain event methods
        // We check for methods/properties that indicate it's an aggregate
        const isAggregate =
            entity instanceof AggregateRoot ||
            entity instanceof Entity ||
            typeof entity.getDomainEvents === 'function' ||
            typeof entity.addDomainEvent === 'function' ||
            (entity as any).uncommittedEvents !== undefined;

        if (!isAggregate) {
            return;
        }

        // Get the query runner from the event
        const queryRunner = event.manager?.queryRunner;
        if (!queryRunner) {
            // No active transaction, skip event collection
            this.logger.debug('No active query runner, skipping event collection');
            return;
        }

        // Get or create UnitOfWorkContext
        const context = UnitOfWorkContext.getOrCreate(queryRunner);

        // Mark entity as persisted (for change tracking)
        if (entity.__markAsPersisted) {
            entity.__markAsPersisted();
        }

        // Collect domain events from aggregate
        if (entity instanceof AggregateRoot) {
            const domainEvents = this.collectDomainEvents(entity, operation, event);
            if (domainEvents.length > 0) {
                context.addEvents(domainEvents);
                this.logger.debug(
                    `Collected ${domainEvents.length} domain events from ${entity.constructor.name} (${operation})`,
                );
            }
        }

        // For entities (non-aggregates), we can still detect changes
        // but they typically don't emit domain events directly
        // This is where you could add entity-level event generation if needed
    }

    /**
     * Collect domain events from an aggregate
     *
     * This method:
     * 1. Gets events from the aggregate's internal event collection
     * 2. Optionally generates events based on field changes
     * 3. Returns all events to be added to the context
     */
    private collectDomainEvents(
        aggregate: AggregateRoot,
        operation: 'insert' | 'update' | 'remove',
        event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>,
    ): DomainEvent[] {
        const events: DomainEvent[] = [];

        // Try to get events using the getDomainEvents method (if available)
        if (typeof aggregate.getDomainEvents === 'function') {
            const explicitEvents = aggregate.getDomainEvents();
            if (Array.isArray(explicitEvents)) {
                events.push(...explicitEvents.filter((e): e is DomainEvent => e instanceof DomainEvent || (e as any)?.eventType !== undefined));
            }
        }

        // Also check NestJS CQRS uncommittedEvents (if using NestJS CQRS pattern)
        const uncommittedEvents = (aggregate as any).uncommittedEvents;
        if (Array.isArray(uncommittedEvents)) {
            events.push(...uncommittedEvents.filter((e): e is DomainEvent => e instanceof DomainEvent || (e as any)?.eventType !== undefined));
        }

        // Clear events from aggregate (they're now in our context)
        if (typeof aggregate.clearDomainEvents === 'function') {
            aggregate.clearDomainEvents();
        }
        if ((aggregate as any).uncommittedEvents) {
            (aggregate as any).uncommittedEvents = [];
        }

        // For updates, we can generate events based on field changes
        if (operation === 'update') {
            // Type guard: check if event has UpdateEvent properties
            if ('updatedColumns' in event || 'updatedRelations' in event) {
                const changeEvents = this.generateChangeEvents(aggregate, event as UpdateEvent<any>);
                events.push(...changeEvents);
            }
        }

        return events;
    }

    /**
     * Generate domain events based on field changes
     *
     * This is a hook for generating events automatically when specific fields change.
     * Override or extend this method to add custom change detection logic.
     *
     * Example: If User.email changes, generate UserEmailChangedEvent
     */
    private generateChangeEvents(
        aggregate: AggregateRoot,
        event: UpdateEvent<any>,
    ): DomainEvent[] {
        const events: DomainEvent[] = [];
        const changedFields = aggregate.__getChangedFields();

        // Example: Generate events based on changed fields
        // This is a template - you would implement specific logic per aggregate type
        // For now, we rely on aggregates to explicitly add events via addDomainEvent()

        // You could add logic like:
        // if (changedFields.email) {
        //   events.push(new UserEmailChangedEvent(aggregate.id, changedFields.email.old, changedFields.email.new));
        // }

        return events;
    }

    /**
     * Get the entity class name for logging
     */
    private getEntityName(entity: any): string {
        return entity?.constructor?.name || 'Unknown';
    }
}

