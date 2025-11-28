import { Global, Module } from '@nestjs/common';
import { OutboxModule } from '../outbox/outbox.module';
import { UnitOfWorkService } from './unit-of-work.service';

/**
 * Unit of Work Module
 *
 * Provides generic Unit of Work pattern with automatic domain event collection.
 * This module is global so it can be used across all bounded contexts.
 *
 * Note: EntityChangeSubscriber is registered via TypeORM configuration in app.module.ts
 */
@Global()
@Module({
    imports: [OutboxModule],
    providers: [UnitOfWorkService],
    exports: [UnitOfWorkService],
})
export class UnitOfWorkModule { }

