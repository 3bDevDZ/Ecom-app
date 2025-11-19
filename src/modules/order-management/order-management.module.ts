import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Order Management Module (Bounded Context)
 * 
 * Responsibilities:
 * - Shopping cart management (add, update, remove items)
 * - Order placement and processing
 * - Inventory reservation (30-minute timeout)
 * - Order status tracking (Pending → Confirmed → External)
 * - Integration with external OMS via RabbitMQ
 * - Email notifications (order confirmation)
 * - Saga orchestration for complex workflows
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      // CartEntity, OrderEntity, OrderItemEntity will be added later
    ]),
  ],
  controllers: [
    // CartController, OrderController will be added in T018/T019
  ],
  providers: [
    // Command handlers, query handlers, repositories will be added later
    // OrderSaga for order processing workflow
    // InventoryService for reservation management
  ],
  exports: [],
})
export class OrderManagementModule {}

