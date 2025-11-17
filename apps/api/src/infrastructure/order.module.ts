import { Module } from '@nestjs/common';
import { OrderController } from './http/order.controller';
import { GetOrderDetailsUseCase } from '../application/order/use-cases/get-order-details.use-case';
import { GetCustomerOrdersUseCase } from '../application/order/use-cases/get-customer-orders.use-case';
import { InMemoryOrderRepository } from './persistence/in-memory-order.repository';
import { IOrderRepository } from '../domain/order/repositories/order.repository.interface';

/**
 * Order Module
 * Wires together all dependencies for the order feature
 */
@Module({
  controllers: [OrderController],
  providers: [
    GetOrderDetailsUseCase,
    GetCustomerOrdersUseCase,
    {
      provide: IOrderRepository,
      useClass: InMemoryOrderRepository,
    },
  ],
  exports: [GetOrderDetailsUseCase, GetCustomerOrdersUseCase],
})
export class OrderModule {}
