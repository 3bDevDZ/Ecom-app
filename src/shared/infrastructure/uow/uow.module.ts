import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitOfWorkService } from './uow.service';

@Module({
    imports: [TypeOrmModule.forFeature([])], // no entities needed
    providers: [UnitOfWorkService],
    exports: [UnitOfWorkService],
})
export class UnitOfWorkModule { }
