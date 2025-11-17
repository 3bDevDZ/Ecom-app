import { Module } from '@nestjs/common';
import { OrderController } from './http/order.controller';
import { GetOrderDetailsUseCase } from '../application/order/use-cases/get-order-details.use-case';
import { GetCustomerOrdersUseCase } from '../application/order/use-cases/get-customer-orders.use-case';
import { InMemoryOrderRepository } from './persistence/in-memory-order.repository';
import { ORDER_REPOSITORY } from './tokens';

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
      provide: ORDER_REPOSITORY,
      useClass: InMemoryOrderRepository,
    },
  ],
  exports: [GetOrderDetailsUseCase, GetCustomerOrdersUseCase, ORDER_REPOSITORY],
})
export class OrderModule {}
