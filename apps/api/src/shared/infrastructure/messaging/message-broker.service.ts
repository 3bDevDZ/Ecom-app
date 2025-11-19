import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { ChannelWrapper, AmqpConnectionManager, connect } from 'amqp-connection-manager';
import { getErrorDetails } from '@common/utils/error.util';

/**
 * RabbitMQ Message Broker Service
 *
 * Manages connection to RabbitMQ and provides methods for
 * publishing messages to exchanges and consuming from queues.
 */
// TODO! implement onModuleInit to establish connection
@Injectable()
export class MessageBrokerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessageBrokerService.name);
  private connection!: AmqpConnectionManager;
  private channelWrapper!: ChannelWrapper;
  private readonly rabbitmqUrl: string;
  constructor(private readonly configService: ConfigService) {
    this.rabbitmqUrl = this.configService.get<string>(
      'rabbitmq.url',
      'amqp://guest:guest@localhost:5672',
    );
  }

  async onModuleInit() {
    await this.connect();
    await this.setupTopology();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Connect to RabbitMQ
   */
  private async connect(): Promise<void> {
    try {
      this.connection = connect([this.rabbitmqUrl], {
        heartbeatIntervalInSeconds: 30,
        reconnectTimeInSeconds: 2,
      });

      this.connection.on('connect', () => {
        this.logger.log('Connected to RabbitMQ');
      });

      this.connection.on('disconnect', (err) => {
        const { message } = getErrorDetails(err);
        this.logger.warn('Disconnected from RabbitMQ', message);
      });

      this.connection.on('connectFailed', (err) => {
        const { message } = getErrorDetails(err);
        this.logger.error('Failed to connect to RabbitMQ', message);
      });

      this.channelWrapper = this.connection.createChannel({
        setup: async (channel: amqp.ConfirmChannel) => {
          await this.setupChannel(channel);
        },
      });

      await this.channelWrapper.waitForConnect();
      this.logger.log('RabbitMQ channel ready');
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error('Failed to initialize RabbitMQ connection', message, stack);
      throw error;
    }
  }

  /**
   * Setup channel (called on connect/reconnect)
   */
  private async setupChannel(channel: amqp.ConfirmChannel): Promise<void> {
    const prefetchCount = this.configService.get<number>('rabbitmq.prefetchCount', 10);
    await channel.prefetch(prefetchCount);
    this.logger.debug(`Channel prefetch set to ${prefetchCount}`);
  }

  /**
   * Setup RabbitMQ topology (exchanges and queues)
   */
  private async setupTopology(): Promise<void> {
    try {
      const exchanges = this.configService.get<Record<string, string>>('rabbitmq.exchanges', {});
      const queues = this.configService.get<Record<string, string>>('rabbitmq.queues', {});
      const messageTtl = this.configService.get<number>('rabbitmq.messageTtl', 604800000);

      // Create exchanges
      await this.channelWrapper.addSetup(async (channel: amqp.ConfirmChannel) => {
        // Domain events exchange
        await channel.assertExchange(exchanges.domainEvents || 'domain.events', 'topic', {
          durable: true,
        });
        this.logger.log(`Exchange '${exchanges.domainEvents}' created`);

        // Integration events exchange
        await channel.assertExchange(exchanges.integrationEvents || 'integration.events', 'topic', {
          durable: true,
        });
        this.logger.log(`Exchange '${exchanges.integrationEvents}' created`);

        // Dead letter exchange
        await channel.assertExchange(exchanges.deadLetter || 'dead.letter', 'topic', {
          durable: true,
        });
        this.logger.log(`Exchange '${exchanges.deadLetter}' created`);

        // Create queues with dead-letter configuration
        const queueOptions = {
          durable: true,
          messageTtl,
          deadLetterExchange: exchanges.deadLetter || 'dead.letter',
          deadLetterRoutingKey: 'dead.letter',
        };

        // Order events queue
        await channel.assertQueue(queues.orderEvents || 'order.events', queueOptions);
        await channel.bindQueue(
          queues.orderEvents || 'order.events',
          exchanges.domainEvents || 'domain.events',
          'order.*',
        );
        this.logger.log(`Queue '${queues.orderEvents}' created and bound`);

        // Inventory events queue
        await channel.assertQueue(queues.inventoryEvents || 'inventory.events', queueOptions);
        await channel.bindQueue(
          queues.inventoryEvents || 'inventory.events',
          exchanges.domainEvents || 'domain.events',
          'product.*',
        );
        this.logger.log(`Queue '${queues.inventoryEvents}' created and bound`);

        // Notification events queue
        await channel.assertQueue(queues.notificationEvents || 'notification.events', queueOptions);
        await channel.bindQueue(
          queues.notificationEvents || 'notification.events',
          exchanges.domainEvents || 'domain.events',
          '*.created',
        );
        await channel.bindQueue(
          queues.notificationEvents || 'notification.events',
          exchanges.domainEvents || 'domain.events',
          'order.*',
        );
        this.logger.log(`Queue '${queues.notificationEvents}' created and bound`);

        // Dead letter queue
        await channel.assertQueue(queues.deadLetter || 'dead.letter.queue', {
          durable: true,
        });
        await channel.bindQueue(
          queues.deadLetter || 'dead.letter.queue',
          exchanges.deadLetter || 'dead.letter',
          '#',
        );
        this.logger.log(`Dead letter queue '${queues.deadLetter}' created and bound`);
      });

      this.logger.log('RabbitMQ topology setup complete');
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error('Failed to setup RabbitMQ topology', message, stack);
      throw error;
    }
  }

  /**
   * Publish a message to an exchange
   */
  async publish(
    exchange: string,
    routingKey: string,
    message: any,
    options?: amqp.Options.Publish,
  ): Promise<void> {
    try {
      await this.channelWrapper.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
          contentType: 'application/json',
          ...options,
        },
      );

      this.logger.debug(`Message published to ${exchange} with routing key ${routingKey}`);
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error(`Failed to publish message to ${exchange}:${routingKey}`, message, stack);
      throw error;
    }
  }

  /**
   * Subscribe to a queue
   */
  async subscribe(queue: string, handler: (message: any) => Promise<void>): Promise<void> {
    try {
      await this.channelWrapper.addSetup(async (channel: amqp.ConfirmChannel) => {
        await channel.consume(queue, async (msg) => {
          if (!msg) {
            return;
          }

          try {
            const content = JSON.parse(msg.content.toString());
            await handler(content);
            channel.ack(msg);
            this.logger.debug(`Message from ${queue} processed successfully`);
          } catch (error) {
            const { message, stack } = getErrorDetails(error);
            this.logger.error(`Error processing message from ${queue}`, message, stack);
            // Reject and requeue the message
            channel.nack(msg, false, true);
          }
        });
      });

      this.logger.log(`Subscribed to queue: ${queue}`);
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error(`Failed to subscribe to queue ${queue}`, message, stack);
      throw error;
    }
  }

  /**
   * Disconnect from RabbitMQ
   */
  private async disconnect(): Promise<void> {
    try {
      await this.channelWrapper.close();
      await this.connection.close();
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error('Error disconnecting from RabbitMQ', message, stack);
    }
  }

  /**
   * Get the channel wrapper for advanced operations
   */
  getChannel(): ChannelWrapper {
    return this.channelWrapper;
  }
}
