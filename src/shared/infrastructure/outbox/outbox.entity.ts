import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('outbox')
export class OutboxEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  eventType: string;

  @Column({ type: 'varchar', length: 255 })
  aggregateId: string;

  @Column({ type: 'varchar', length: 100 })
  aggregateType: string;

  @Column({ type: 'jsonb' })
  payload: any;

  @Column({ default: false })
  processed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor: Date | null;
}
