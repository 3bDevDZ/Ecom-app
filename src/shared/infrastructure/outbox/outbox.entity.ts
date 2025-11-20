import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

/**
 * Outbox Entity
 *
 * Implements the Outbox Pattern for reliable event publishing.
 * Events are stored in the database within the same transaction as business data,
 * then asynchronously published to RabbitMQ by the OutboxProcessor.
 */
@Entity('outbox')
@Index(['processed', 'createdAt'])
export class OutboxEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  eventType!: string;

  @Column({ type: 'varchar', length: 255 })
  aggregateId!: string;

  @Column({ type: 'varchar', length: 100 })
  aggregateType!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  processed!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  processedAt!: Date | null;

  @Column({ type: 'int', default: 0 })
  retryCount!: number;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor!: Date | null;
}
