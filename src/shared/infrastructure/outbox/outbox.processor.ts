import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { OutboxService } from './outbox.service';
import { OutboxEntity } from './outbox.entity';
import { getErrorDetails } from '@common/utils/error.util';

/**
 * Outbox Processor
 *
 * Periodically polls the outbox table for unprocessed events
 * and publishes them to RabbitMQ.
 *
 * Runs every 5 seconds by default (configurable).
 */
@Injectable()
export class OutboxProcessor implements OnModuleInit {
  private readonly logger = new Logger(OutboxProcessor.name);
  private isProcessing = false;
  private readonly maxRetries: number;
  private eventPublisher: any; // Will be injected from messaging module

  constructor(
    private readonly outboxService: OutboxService,
    private readonly configService: ConfigService,
  ) {
    this.maxRetries = this.configService.get<number>('rabbitmq.retryAttempts', 5);
  }

  onModuleInit() {
    this.logger.log('Outbox Processor initialized');
  }

  /**
   * Set the event publisher (injected after module initialization)
   */
  setEventPublisher(publisher: any): void {
    this.eventPublisher = publisher;
  }

  /**
   * Process outbox events every 5 seconds
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutbox(): Promise<void> {
    if (this.isProcessing) {
      this.logger.debug('Outbox processing already in progress, skipping...');
      return;
    }

    if (!this.eventPublisher) {
      this.logger.debug('Event publisher not initialized yet, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      const events = await this.outboxService.getUnprocessedEvents(100);

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
      const { message, stack } = getErrorDetails(error);
      this.logger.error('Error processing outbox events', message, stack);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single outbox event
   */
  private async processEvent(outboxEntry: OutboxEntity): Promise<void> {
    try {
      // Check if max retries exceeded
      if (outboxEntry.retryCount >= this.maxRetries) {
        this.logger.error(
          `Event ${outboxEntry.id} exceeded max retries (${this.maxRetries}), moving to dead-letter`,
        );
        await this.moveToDeadLetter(outboxEntry);
        return;
      }

      // Publish to RabbitMQ
      await this.publishEvent(outboxEntry);

      // Mark as processed
      await this.outboxService.markAsProcessed(outboxEntry.id);

      this.logger.debug(
        `Event ${outboxEntry.id} (${outboxEntry.eventType}) published successfully`,
      );
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error(`Failed to process event ${outboxEntry.id}:`, message, stack);

      // Mark as failed and increment retry count
      await this.outboxService.markAsFailed(outboxEntry.id, message || 'Unknown error');
    }
  }

  /**
   * Publish event to RabbitMQ
   */
  private async publishEvent(outboxEntry: OutboxEntity): Promise<void> {
    if (!this.eventPublisher) {
      throw new Error('Event publisher not initialized');
    }

    const exchange = this.determineExchange(outboxEntry.eventType);
    const routingKey = this.createRoutingKey(outboxEntry.aggregateType, outboxEntry.eventType);

    await this.eventPublisher.publish(exchange, routingKey, outboxEntry.payload, {
      persistent: true,
      timestamp: outboxEntry.createdAt.getTime(),
      messageId: outboxEntry.id,
      type: outboxEntry.eventType,
    });
  }

  /**
   * Determine which exchange to use based on event type
   */
  private determineExchange(_eventType: string): string {
    // Domain events go to domain.events exchange
    // Integration events would go to integration.events
    return 'domain.events';
  }

  /**
   * Create routing key for RabbitMQ
   * Format: {aggregateType}.{eventType}
   * Example: Product.ProductCreatedEvent
   */
  private createRoutingKey(aggregateType: string, eventType: string): string {
    return `${aggregateType.toLowerCase()}.${eventType}`;
  }

  /**
   * Move event to dead-letter queue
   */
  private async moveToDeadLetter(outboxEntry: OutboxEntity): Promise<void> {
    try {
      if (!this.eventPublisher) {
        throw new Error('Event publisher not initialized');
      }

      // Publish to dead-letter exchange
      await this.eventPublisher.publish(
        'dead.letter',
        'outbox.failed',
        {
          ...outboxEntry.payload,
          originalEventType: outboxEntry.eventType,
          failureReason: outboxEntry.error || 'Max retries exceeded',
          retryCount: outboxEntry.retryCount,
        },
        {
          persistent: true,
          timestamp: new Date().getTime(),
          messageId: outboxEntry.id,
        },
      );

      // Mark as processed (moved to DLQ)
      await this.outboxService.markAsProcessed(outboxEntry.id);

      this.logger.warn(
        `Event ${outboxEntry.id} moved to dead-letter queue after ${outboxEntry.retryCount} retries`,
      );
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error(
        `Failed to move event ${outboxEntry.id} to dead-letter queue`,
        message,
        stack,
      );
    }
  }
}
