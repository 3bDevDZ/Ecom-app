// src/shared/event/event.module.ts
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventBusService } from './event-bus.service';
import { OutboxEntity } from './outbox/outbox.entity';
import { OutboxPublisherService } from './outbox/outbox.publisher.service';

@Global()
@Module({
    imports: [
        RabbitMQModule.forRootAsync({
            useFactory: (config: ConfigService) => {
                const queueName = config.get<string>('RABBITMQ_QUEUE');
                // Auto-declare all queues from config
                const messageTtl = config.get<number>('RABBITMQ_MESSAGE_TTL', 604800000);
                const maxLength = config.get<number>('RABBITMQ_MAX_LENGTH', 100000);

                const queues = [
                    {
                        name: String(queueName),
                        createQueueIfNotExists: false, // Queue already exists via definitions.json
                        exchange: 'domain.events',
                        routingKey: queueName, // ← key = queue name (direct exchange)
                    }
                ];

                return {
                    exchanges: [
                        {
                            name: 'domain.events',
                            type: 'direct', // ← DIRECT EXCHANGE
                            createExchangeIfNotExists: true,
                        },
                        {
                            name: 'dead.letter',
                            type: 'direct',
                            createExchangeIfNotExists: true,
                        },
                    ],
                    queues,
                    uri: config.get<string>('RABBITMQ_URI') || config.get<string>('RABBITMQ_URL') || 'amqp://ecommerce:ecommerce_password@localhost:5672',
                    connectionInitOptions: { wait: false },
                };
            },
            inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([OutboxEntity]),
    ],
    providers: [EventBusService, OutboxPublisherService],
    exports: [EventBusService],
})
export class EventModule implements OnModuleInit {
    constructor(private readonly publisher: OutboxPublisherService) { }

    onModuleInit() {
        this.publisher.start();
    }
}
