import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { MessageBrokerService } from './message-broker.service';
import { EventPublisherService } from './event-publisher.service';

/**
 * Messaging Module
 * 
 * Provides RabbitMQ messaging infrastructure
 * Available globally across the application
 */
@Global()
@Module({
  imports: [ConfigModule, CqrsModule],
  providers: [MessageBrokerService, EventPublisherService],
  exports: [MessageBrokerService, EventPublisherService],
})
export class MessagingModule {}

