import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagingModule } from '../messaging/messaging.module';
import { OutboxEntity } from './outbox.entity';
import { OutboxProcessor } from './outbox.processor';
import { OutboxService } from './outbox.service';

/**
 * Outbox Module
 *
 * Provides the Outbox Pattern infrastructure for reliable event publishing.
 * This module should be imported by any module that needs to use the OutboxService.
 *
 * The OutboxProcessor runs as a background job (every 5 seconds) to publish
 * events from the outbox table to RabbitMQ.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([OutboxEntity]),
    MessagingModule, // For MessageBrokerService to publish to RabbitMQ
  ],
  providers: [OutboxService, OutboxProcessor],
  exports: [OutboxService],
})
export class OutboxModule { }

