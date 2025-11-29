// src/shared/event/event-bus.service.ts
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { DomainEvent } from '../domain';
import { OutboxEntity } from './outbox/outbox.entity';

@Injectable()
export class EventBusService {
    constructor(
        private readonly amqpConnection: AmqpConnection,
        @InjectRepository(OutboxEntity)
        private readonly outboxRepo: Repository<OutboxEntity>,
    ) { }

    async publish(event: DomainEvent, entityManager?: EntityManager): Promise<void> {
        const repo = entityManager
            ? entityManager.getRepository(OutboxEntity)
            : this.outboxRepo;

        const aggregateType = this.extractAggregateType(event);

        await repo.save({
            eventType: event.eventType || event.constructor.name,
            aggregateId: event.aggregateId,
            aggregateType,
            payload: event,
            processed: false,
            retryCount: 0,
        });
    }

    private extractAggregateType(event: DomainEvent): string {
        // Extract aggregate type from event name (e.g., "ProductCreatedEvent" -> "Product")
        const eventType = event.constructor.name;
        const match = eventType.match(/^(\w+?)(?:Created|Updated|Deleted|Event|Placed|Reserved|Released)/);
        return match ? match[1] : 'Unknown';
    }

    async publishNow(routingKey: string, payload: any): Promise<void> {
        await this.amqpConnection.publish('domain.events', routingKey, payload, {
            persistent: true,
        });
    }
}
