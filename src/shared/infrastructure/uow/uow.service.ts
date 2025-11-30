// src/shared/infrastructure/uow/unit-of-work.service.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventBusService } from '../../event/event-bus.service';
import { UnitOfWorkContext } from './uow.context';

// src/shared/infrastructure/uow/unit-of-work.service.ts (updated)
@Injectable()
export class UnitOfWorkService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly eventBus: EventBusService,
    ) { }
    async run<T>(work: (uow: UnitOfWorkContext) => Promise<T>): Promise<T> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        const uow = new UnitOfWorkContext(queryRunner);

        try {
            const result = await work(uow);

            // Save events to outbox IN SAME TRANSACTION
            const entityManager = queryRunner.manager;
            for (const event of uow.pendingEvents) {
                await this.eventBus.publish(event, entityManager);
            }

            await queryRunner.commitTransaction();
            return result;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}
