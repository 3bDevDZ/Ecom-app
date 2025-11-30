// src/shared/event/outbox/outbox.publisher.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getQueueForEvent } from '../../../config/rabbitmq.config';
import { EventBusService } from '../../event/event-bus.service';
import { OutboxEntity } from './outbox.entity';
import { OutboxService } from './outbox.service';


@Injectable()
export class OutboxProcessorService {
  private readonly maxRetries: number;
  private readonly batchSize: number;
  private readonly logger = new Logger(OutboxProcessorService.name);
  private isProcessing = false;
  constructor(
    @InjectRepository(OutboxEntity)
    private readonly outboxRepo: Repository<OutboxEntity>,
    private readonly eventBus: EventBusService,
    private readonly configService: ConfigService,
    private readonly outBoxService: OutboxService,
  ) {
    this.maxRetries = this.configService.get<number>('OUTBOX_MAX_RETRIES', 5);
    this.batchSize = this.configService.get<number>('OUTBOX_BATCH_SIZE', 100);
  }

  onModuleInit() {
    this.logger.log('Outbox Processor initialized');
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processOutbox() {
    if (this.isProcessing) {
      this.logger.debug('Outbox processing already in progress, skipping...');
      return;
    }
    this.isProcessing = true;
    try {
      const events = await this.outBoxService.getUnprocessedEvents(this.batchSize);

      if (events.length === 0) {
        this.logger.debug('No unprocessed events in outbox');
        return;
      }

      this.logger.log(`Processing ${events.length} events from outbox`);

      for (const event of events) {
        await this.processEvent(event);
      }

      this.logger.log(`Successfully processed ${events.length} events`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Error processing outbox:', message);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEvent(record: OutboxEntity): Promise<void> {
    try {
      // Check retry limit BEFORE publishing
      if (record.retryCount >= this.maxRetries) {
        this.logger.warn(
          `Event ${record.id} (${record.eventType}) exceeded max retries (${this.maxRetries}) — moving to DLQ`,
        );
        await this.moveToDeadLetter(record);
        return;
      }
      await this.outboxRepo.update(record.id, {
        processed: true,
        processedAt: new Date(),
      });

      // Compute routing key from config (e.g., 'order.placed.queue')
      const routingKey = getQueueForEvent(record.eventType);

      // Only mark as processed AFTER successful publish
      await this.eventBus.publishNow(routingKey, record.payload);

      this.logger.debug(
        `Event ${record.id} (${record.eventType}) published to '${routingKey}'`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to publish event ${record.id} (${record.eventType}):`, message);

      await this.outBoxService.markAsFailed(record.id, message);
    }
  }

  /**
   * Move event to dead-letter — delegate publishing to EventBusService
   */
  private async moveToDeadLetter(record: OutboxEntity): Promise<void> {
    try {
      // 🔁 Reuse .publishNow with DLQ routing key
      const dlqRoutingKey = this.configService.get<string>('RABBITMQ_DEAD_LETTER_QUEUE');

      const dlqPayload = {
        ...record.payload,
        outboxId: record.id,
        originalQueue: getQueueForEvent(record.eventType),
        failureReason: record.error || 'Max retries exceeded',
        retryCount: record.retryCount,
        originalEventName: record.eventType,
      };

      await this.eventBus.publishToDeadLetter(dlqRoutingKey, dlqPayload);

      await this.outboxRepo.update(record.id, {
        processed: true,
        processedAt: new Date(),
      });

      this.logger.warn(`Event ${record.id} moved to DLQ: '${dlqRoutingKey}'`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to move event ${record.id} to DLQ:`, message);
      await this.outBoxService.markAsFailed(record.id, message);
    }
  }
}
