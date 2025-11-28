import { getErrorDetails } from '@common/utils/error.util';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MessageBrokerService } from '../messaging/message-broker.service';
import { OutboxEntity } from './outbox.entity';
import { OutboxService } from './outbox.service';

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

  constructor(
    private readonly outboxService: OutboxService,
    private readonly configService: ConfigService,
    private readonly messageBroker: MessageBrokerService,
  ) {
    this.maxRetries = this.configService.get<number>('rabbitmq.retryAttempts', 5);
  }

  onModuleInit() {
    this.logger.log('Outbox Processor initialized');
    this.logger.log('MessageBrokerService is available - events will be published to RabbitMQ');
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
      this.logger.error(
        `Error processing outbox events: ${message}${stack ? '\nStack: ' + stack : ''}`,
      );
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
      this.logger.error(
        `Failed to process event ${outboxEntry.id}: ${message}${stack ? '\nStack: ' + stack : ''}`,
      );

      // Mark as failed and increment retry count
      await this.outboxService.markAsFailed(outboxEntry.id, message || 'Unknown error');
    }
  }

  /**
   * Publish event to RabbitMQ
   * Uses exchange and routing key from configuration
   */
  private async publishEvent(outboxEntry: OutboxEntity): Promise<void> {
    const exchangeName = this.configService.get<string>('rabbitmq.exchangeName', 'domain.events');
    const routingKeys = this.configService.get<Record<string, string>>('rabbitmq.routingKeys', {});
    const queueNames = this.configService.get<Record<string, string>>('rabbitmq.queueNames', {});

    // Get routing key from configuration based on event type
    const routingKey = routingKeys[outboxEntry.eventType];
    const queueName = queueNames[outboxEntry.eventType];

    if (!routingKey) {
      const errorMsg = `Routing key not found in config for event type "${outboxEntry.eventType}"`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (!queueName) {
      this.logger.warn(
        `Queue name not found in config for event type "${outboxEntry.eventType}", but routing key exists: "${routingKey}"`,
      );
    }

    this.logger.debug(
      `Publishing event ${outboxEntry.id} (${outboxEntry.eventType}) to exchange: ${exchangeName}, routingKey: ${routingKey}${queueName ? `, queue: ${queueName}` : ''}`,
    );

    await this.messageBroker.publish(exchangeName, routingKey, outboxEntry.payload, {
      persistent: true,
      timestamp: outboxEntry.createdAt.getTime(),
      messageId: outboxEntry.id,
      type: outboxEntry.eventType,
    });

    this.logger.debug(`Successfully published event ${outboxEntry.id} to exchange ${exchangeName} with routing key ${routingKey}`);
  }



  /**
   * Move event to dead-letter queue
   */
  private async moveToDeadLetter(outboxEntry: OutboxEntity): Promise<void> {
    try {
      // Publish directly to dead-letter queue (more reliable than using exchange)
      const deadLetterQueue = this.configService.get<string>('RABBITMQ_DEAD_LETTER_QUEUE') || 'dead.letter.queue';

      await this.messageBroker.publishToQueue(
        deadLetterQueue,
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
        `Failed to move event ${outboxEntry.id} to dead-letter queue: ${message}${stack ? '\nStack: ' + stack : ''}`,
      );
    }
  }
}
