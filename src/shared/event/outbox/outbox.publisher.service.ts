// src/shared/event/outbox/outbox.publisher.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getQueueForEvent } from '../../../config/rabbitmq.config';
import { EventBusService } from '../event-bus.service';
import { OutboxEntity } from './outbox.entity';

//ToDo: add retry logic to publish events that failed to publish
//ToDo: use env var for the interval time
@Injectable()
export class OutboxPublisherService {
    private interval: NodeJS.Timeout | null = null;

    constructor(
        @InjectRepository(OutboxEntity)
        private readonly outboxRepo: Repository<OutboxEntity>,
        private readonly eventBus: EventBusService,
    ) { }

    start() {
        if (this.interval) return;
        this.interval = setInterval(() => this.processOutbox(), 5000); // process outbox every 5 seconds
    }

    async processOutbox() {
        const unprocessed = await this.outboxRepo.find({
            where: { processed: false },
            take: 100,
            order: { createdAt: 'ASC' }, // to ensure that events are published in the order they were created FIFO
        });

        for (const record of unprocessed) {
            try {
                // Compute routing key from event data
                const routingKey = this.getQueueForEvent(record.eventType);

                // save first then publish to assure that event is saved before being published
                record.processed = true;
                record.processedAt = new Date();
                await this.outboxRepo.save(record);
                await this.eventBus.publishNow(routingKey, record.payload);
            } catch (err) {
                record.retryCount += 1;
                record.error = err instanceof Error ? err.message : String(err);
                await this.outboxRepo.save(record);
                console.error(`Failed to publish event ${record.eventType}:`, err);
            }
        }
    }

    private getQueueForEvent(eventName: string): string {
        return getQueueForEvent(eventName);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}
