import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventModule } from '../../event/event.module';
import { UnitOfWorkContextService } from './uow-context.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([]), // no entities needed
        CqrsModule, // For EventBus
        EventModule, // For EventBusService
    ],
    providers: [
        UnitOfWorkContextService, // Request-scoped service for transaction context
    ],
    exports: [
        UnitOfWorkContextService, // Export so repositories can inject it
    ],
})
export class UnitOfWorkModule { }
