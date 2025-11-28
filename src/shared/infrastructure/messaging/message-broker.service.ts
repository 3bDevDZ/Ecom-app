import { getErrorDetails } from '@common/utils/error.util';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmqpConnectionManager, ChannelWrapper, connect } from 'amqp-connection-manager';
import * as amqp from 'amqplib';
import { randomUUID } from 'crypto';

/**
 * RabbitMQ Message Broker Service
 *
 * Manages connection to RabbitMQ and provides methods for
 * publishing messages to exchanges and consuming from queues.
 *
 * This service identifies messages published by this instance
 * and skips processing them to avoid processing own events.
 */
@Injectable()
export class MessageBrokerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessageBrokerService.name);
  private connection!: AmqpConnectionManager;
  private channelWrapper!: ChannelWrapper;
  private readonly rabbitmqUrl: string;
  private readonly instanceId: string; // Unique ID for this application instance
  constructor(private readonly configService: ConfigService) {
    // Use same pattern as database config in app.module.ts
    this.rabbitmqUrl =
      this.configService.get<string>('RABBITMQ_URL') ||
      process.env.RABBITMQ_URL ||
      'amqp://guest:guest@localhost:5672';

    // Generate unique instance ID for this application instance
    // This is used to identify messages published by this instance
    this.instanceId = process.env.APP_INSTANCE_ID || randomUUID();
    this.logger.log(`Application instance ID: ${this.instanceId}`);

    // Log connection details (without password) for debugging
    try {
      const urlObj = new URL(this.rabbitmqUrl);
      this.logger.log(`Connecting to RabbitMQ: ${urlObj.protocol}//${urlObj.hostname}:${urlObj.port}`);
    } catch (error) {
      this.logger.warn(`Invalid RabbitMQ URL format: ${this.rabbitmqUrl}`);
    }
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
        this.logger.warn(`Disconnected from RabbitMQ: ${message}`);
      });

      this.connection.on('connectFailed', (err) => {
        // Handle different error types from amqp-connection-manager
        let errorMessage = 'Unknown error';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else if (err && typeof err === 'object') {
          // Try to extract message from error object
          errorMessage = (err as any).message || (err as any).err?.message || JSON.stringify(err);
        }
        this.logger.error(`Failed to connect to RabbitMQ: ${errorMessage}`);
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
      const errorMsg = `Failed to initialize RabbitMQ connection: ${message}${stack ? '\nStack: ' + stack : ''}`;
      this.logger.error(errorMsg);
      throw error;
    }
  }

  /**
   * Setup channel (called on connect/reconnect)
   */
  private async setupChannel(channel: amqp.ConfirmChannel): Promise<void> {
    const prefetchCount =
      parseInt(this.configService.get<string>('RABBITMQ_PREFETCH_COUNT') || '10', 10) ||
      this.configService.get<number>('rabbitmq.prefetchCount', 10);
    await channel.prefetch(prefetchCount);
    this.logger.debug(`Channel prefetch set to ${prefetchCount}`);
  }

  /**
   * Setup RabbitMQ topology (exchanges and queues with bindings)
   * Uses configuration-based routing keys and queue names
   */
  private async setupTopology(): Promise<void> {
    try {
      const exchangeName = this.configService.get<string>('rabbitmq.exchangeName', 'domain.events');
      const routingKeys = this.configService.get<Record<string, string>>('rabbitmq.routingKeys', {});
      const queueNames = this.configService.get<Record<string, string>>('rabbitmq.queueNames', {});
      const queues = this.configService.get<Record<string, string>>('rabbitmq.queues', {});
      const messageTtl =
        parseInt(this.configService.get<string>('RABBITMQ_MESSAGE_TTL') || '604800000', 10) ||
        604800000;

      // Create exchanges and queues with bindings
      await this.channelWrapper.addSetup(async (channel: amqp.ConfirmChannel) => {
        // Create exchange (direct type for exact routing key matching)
        await channel.assertExchange(exchangeName, 'direct', {
          durable: true,
        });
        this.logger.log(`Exchange '${exchangeName}' created`);

        // Create queues with TTL configuration
        const queueOptions = {
          durable: true,
          messageTtl,
        };

        // Helper to safely delete queue if it exists
        // This prevents PRECONDITION_FAILED errors by ensuring queues are deleted before recreation
        const deleteQueueIfExists = async (queueName: string) => {
          try {
            await channel.deleteQueue(queueName, { ifEmpty: false });
            this.logger.log(`Deleted existing queue '${queueName}' to recreate with correct properties`);
            return true;
          } catch (error: any) {
            if (error.code === 404) {
              // Queue doesn't exist, that's fine
              return false;
            }
            // If channel is closed, that's okay - it will be recreated on next connection
            if (error.message?.includes('Channel closed') || error.message?.includes('IllegalOperationError')) {
              this.logger.debug(`Channel closed while deleting queue '${queueName}', will retry on reconnect`);
              return false;
            }
            // Other errors, log but don't fail
            this.logger.warn(`Could not delete queue '${queueName}': ${error.message}`);
            return false;
          }
        };

        // Helper to safely create queue (delete first if exists, then create) and bind to exchange
        const createQueueSafely = async (queueName: string, options: any, bindings: Array<{ exchange: string; routingKey: string }>) => {
          try {
            // Delete queue first to avoid PRECONDITION_FAILED
            await deleteQueueIfExists(queueName);

            // Create queue with correct properties
            await channel.assertQueue(queueName, options);

            // Bind queue to exchange with routing keys
            for (const binding of bindings) {
              await channel.bindQueue(queueName, binding.exchange, binding.routingKey);
              this.logger.debug(`Bound queue '${queueName}' to exchange '${binding.exchange}' with routing key '${binding.routingKey}'`);
            }

            this.logger.log(`Queue '${queueName}' created and bound with ${bindings.length} routing key(s)`);
            return true;
          } catch (error: any) {
            // If channel is closed, log and return false - setup will retry on reconnect
            if (error.message?.includes('Channel closed') || error.message?.includes('IllegalOperationError')) {
              this.logger.warn(`Channel closed while creating queue '${queueName}', will retry on reconnect`);
              return false;
            }
            // For PRECONDITION_FAILED, log warning and return false - will retry
            if (error.code === 406) {
              this.logger.warn(`Queue '${queueName}' configuration mismatch, will retry on reconnect`);
              return false;
            }
            // Other errors, rethrow
            throw error;
          }
        };

        // Group routing keys by queue name from configuration
        // This creates a map: queueName -> Set<routingKeys>
        const queueBindingsMap = new Map<string, Set<string>>();

        // Build queue bindings from configuration
        // For each event type, get its routing key and queue name, then bind them together
        for (const [eventType, queueName] of Object.entries(queueNames)) {
          const routingKey = routingKeys[eventType];
          if (!routingKey) {
            this.logger.warn(`Routing key not found for event type '${eventType}', skipping queue binding`);
            continue;
          }

          if (!queueBindingsMap.has(queueName)) {
            queueBindingsMap.set(queueName, new Set());
          }
          queueBindingsMap.get(queueName)!.add(routingKey);
        }

        // Create queues and bind them to exchange with routing keys
        for (const [queueName, routingKeysSet] of queueBindingsMap.entries()) {
          const bindings = Array.from(routingKeysSet).map(routingKey => ({
            exchange: exchangeName,
            routingKey,
          }));

          await createQueueSafely(queueName, queueOptions, bindings);
        }

        // Also create standard queues if they exist in config but weren't bound above
        const standardQueues = [
          { name: queues.orderEvents || 'order.events', label: 'order events' },
          { name: queues.inventoryEvents || 'inventory.events', label: 'inventory events' },
          { name: queues.notificationEvents || 'notification.events', label: 'notification events' },
        ];

        for (const queue of standardQueues) {
          if (!queueBindingsMap.has(queue.name)) {
            // Queue exists in config but no bindings defined - create empty queue
            await deleteQueueIfExists(queue.name);
            await channel.assertQueue(queue.name, queueOptions);
            this.logger.log(`Queue '${queue.name}' (${queue.label}) created without bindings`);
          }
        }

        // Dead letter queue (standalone queue, no exchange binding)
        await channel.assertQueue(queues.deadLetter || 'dead.letter.queue', {
          durable: true,
        });
        this.logger.log(`Dead letter queue '${queues.deadLetter}' created`);
      });

      this.logger.log('RabbitMQ topology setup complete');
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      const errorMsg = `Failed to setup RabbitMQ topology: ${message}${stack ? '\nStack: ' + stack : ''}`;
      this.logger.error(errorMsg);
      // Don't throw - let addSetup retry automatically on channel reconnect
      // The error will be logged but won't crash the application
      this.logger.warn('Topology setup will retry automatically on next channel connection');
    }
  }

  /**
   * Publish a message to an exchange
   * Uses confirm channel to wait for RabbitMQ acknowledgment
   */
  async publish(
    exchange: string,
    routingKey: string,
    message: any,
    options?: amqp.Options.Publish,
  ): Promise<void> {
    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));

      // Ensure channel is ready
      await this.channelWrapper.waitForConnect();

      // Add instance ID header to identify messages published by this instance
      const publishOptions: amqp.Options.Publish = {
        persistent: true,
        contentType: 'application/json',
        headers: {
          'x-publisher-instance-id': this.instanceId,
          'x-publisher-service': 'b2b-ecommerce',
          ...options?.headers,
        },
        ...options,
      };

      // Use addSetup to ensure exchange exists and get channel for publishing
      await this.channelWrapper.addSetup(async (channel: amqp.ConfirmChannel) => {
        // Ensure exchange exists before publishing (idempotent operation)
        try {
          await channel.assertExchange(exchange, 'direct', { durable: true });
          this.logger.debug(`Exchange '${exchange}' asserted successfully`);
        } catch (error: any) {
          const { message: errMsg } = getErrorDetails(error);
          this.logger.error(`Failed to assert exchange '${exchange}': ${errMsg}`);
          throw error;
        }

        return new Promise<void>((resolve, reject) => {
          let drainHandled = false;

          const attemptPublish = () => {
            const published = channel.publish(
              exchange,
              routingKey,
              messageBuffer,
              publishOptions,
              (err, ok) => {
                console.log('err', err, 'ok', ok);
                if (err) {
                  const { message: errMsg, stack } = getErrorDetails(err);
                  this.logger.error(
                    `Failed to publish message to ${exchange}:${routingKey}: ${errMsg}${stack ? '\nStack: ' + stack : ''}`,
                  );
                  reject(err);
                } else if (!ok) {
                  const errorMsg = `Message rejected by RabbitMQ: ${exchange}:${routingKey} (messageId: ${options?.messageId || 'N/A'}). Exchange may not exist or routing key doesn't match any bindings.`;
                  this.logger.error(errorMsg);
                  reject(new Error(errorMsg));
                } else {
                  this.logger.debug(
                    `Message confirmed published to ${exchange} with routing key ${routingKey} (messageId: ${options?.messageId || 'N/A'})`,
                  );
                  resolve();
                }
              },
            );

            if (!published && !drainHandled) {
              drainHandled = true;
              this.logger.warn('Channel buffer full, waiting for drain...');

              channel.once('drain', () => {
                attemptPublish(); // Recursively retry
              });

              // Safety timeout in case drain never fires
              setTimeout(() => {
                if (!drainHandled) {
                  reject(new Error('Timeout waiting for channel drain'));
                }
              }, 30000); // 30 second timeout
            }
          };

          attemptPublish();
        });
      });
    } catch (error) {
      const { message: errMsg, stack } = getErrorDetails(error);
      const errorMsg = `Failed to publish message to ${exchange}:${routingKey}: ${errMsg}${stack ? '\nStack: ' + stack : ''}`;
      this.logger.error(errorMsg);
      throw error;
    }
  }

  /**
   * Subscribe to a queue
   * Automatically skips messages published by this instance to avoid processing own events
   */
  async subscribe(queue: string, handler: (message: any) => Promise<void>): Promise<void> {
    try {
      await this.channelWrapper.addSetup(async (channel: amqp.ConfirmChannel) => {
        await channel.consume(queue, async (msg) => {
          if (!msg) {
            return;
          }

          try {
            // Check if message was published by this instance
            const publisherInstanceId = msg.properties.headers?.['x-publisher-instance-id'];
            if (publisherInstanceId === this.instanceId) {
              // Skip messages published by this instance
              this.logger.debug(
                `Skipping message from ${queue} - published by this instance (${this.instanceId})`,
              );
              channel.ack(msg);
              return;
            }

            const content = JSON.parse(msg.content.toString());
            await handler(content);
            channel.ack(msg);
            this.logger.debug(`Message from ${queue} processed successfully`);
          } catch (error) {
            const { message, stack } = getErrorDetails(error);
            const errorMsg = `Error processing message from ${queue}: ${message}${stack ? '\nStack: ' + stack : ''}`;
            this.logger.error(errorMsg);
            // Reject and requeue the message
            channel.nack(msg, false, true);
          }
        });
      });

      this.logger.log(`Subscribed to queue: ${queue} (will skip messages from instance ${this.instanceId})`);
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      const errorMsg = `Failed to subscribe to queue ${queue}: ${message}${stack ? '\nStack: ' + stack : ''}`;
      this.logger.error(errorMsg);
      throw error;
    }
  }

  /**
   * Publish a message directly to a queue (bypasses exchange routing)
   * Useful for dead-letter queues where we want guaranteed delivery
   */
  async publishToQueue(
    queue: string,
    message: any,
    options?: amqp.Options.Publish,
  ): Promise<void> {
    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));

      // Ensure channel is ready
      await this.channelWrapper.waitForConnect();

      // Add instance ID header to identify messages published by this instance
      const publishOptions: amqp.Options.Publish = {
        persistent: true,
        contentType: 'application/json',
        headers: {
          'x-publisher-instance-id': this.instanceId,
          'x-publisher-service': 'b2b-ecommerce',
          ...options?.headers,
        },
        ...options,
      };

      // Use addSetup to ensure queue exists and get channel for publishing
      await this.channelWrapper.addSetup(async (channel: amqp.ConfirmChannel) => {
        // Ensure queue exists (idempotent operation)
        await channel.assertQueue(queue, { durable: true });
        this.logger.debug(`Queue '${queue}' asserted successfully`);

        return new Promise<void>((resolve, reject) => {
          // Send directly to queue using sendToQueue (not publish)
          const sent = channel.sendToQueue(
            queue,
            messageBuffer,
            publishOptions,
            (err, ok) => {
              if (err) {
                const { message: errMsg, stack } = getErrorDetails(err);
                this.logger.error(
                  `Failed to send message to queue ${queue}: ${errMsg}${stack ? '\nStack: ' + stack : ''}`,
                );
                reject(err);
              } else if (!ok) {
                const errorMsg = `Message rejected by RabbitMQ when sending to queue ${queue} (messageId: ${options?.messageId || 'N/A'})`;
                this.logger.error(errorMsg);
                reject(new Error(errorMsg));
              } else {
                this.logger.debug(
                  `Message confirmed sent to queue ${queue} (messageId: ${options?.messageId || 'N/A'})`,
                );
                resolve();
              }
            },
          );

          if (!sent) {
            // Channel buffer is full, wait for drain
            channel.once('drain', () => {
              channel.sendToQueue(queue, messageBuffer, publishOptions, (err, ok) => {
                if (err) {
                  const { message: errMsg, stack } = getErrorDetails(err);
                  this.logger.error(
                    `Failed to send message to queue ${queue} (after drain): ${errMsg}${stack ? '\nStack: ' + stack : ''}`,
                  );
                  reject(err);
                } else if (!ok) {
                  const errorMsg = `Message rejected by RabbitMQ when sending to queue ${queue} (after drain)`;
                  this.logger.error(errorMsg);
                  reject(new Error(errorMsg));
                } else {
                  this.logger.debug(
                    `Message confirmed sent to queue ${queue} (after drain, messageId: ${options?.messageId || 'N/A'})`,
                  );
                  resolve();
                }
              });
            });
          }
        });
      });
    } catch (error) {
      const { message: errMsg, stack } = getErrorDetails(error);
      const errorMsg = `Failed to publish message to queue ${queue}: ${errMsg}${stack ? '\nStack: ' + stack : ''}`;
      this.logger.error(errorMsg);
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
      const errorMsg = `Error disconnecting from RabbitMQ: ${message}${stack ? '\nStack: ' + stack : ''}`;
      this.logger.error(errorMsg);
    }
  }

  /**
   * Get the channel wrapper for advanced operations
   */
  getChannel(): ChannelWrapper {
    return this.channelWrapper;
  }
}
