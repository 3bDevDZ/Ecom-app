import { QueryRunner } from 'typeorm';
import { DomainEvent } from '../../domain';

export class UnitOfWorkContext {
    pendingEvents: DomainEvent[] = [];

    constructor(public readonly queryRunner: QueryRunner) { }

    addEvent(event: DomainEvent) {
        this.pendingEvents.push(event);
    }

    clearEvents() {
        this.pendingEvents = [];
    }
}
