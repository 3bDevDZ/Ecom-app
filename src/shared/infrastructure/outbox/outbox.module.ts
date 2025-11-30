import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEntity } from './outbox.entity';
import { OutboxProcessorService } from './outbox.processor';
import { OutboxService } from './outbox.service';

/**
 * Outbox Module
 *
 * Provides the Outbox Pattern infrastructure for reliable event publishing.
 * This module should be imported by any module that needs to use the OutboxService.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([OutboxEntity]),
  ],
  providers: [OutboxService, OutboxProcessorService],
  exports: [OutboxService],
})
export class OutboxModule { }

