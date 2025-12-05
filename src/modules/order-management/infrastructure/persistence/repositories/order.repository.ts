import { Inject, Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { DataSource, EntityManager } from 'typeorm';
import { EventBusService } from '../../../../../shared/event/event-bus.service';
import { BaseRepository } from '../../../../../shared/infrastructure/database/base.repository';
import { UnitOfWorkContextService } from '../../../../../shared/infrastructure/uow/uow-context.service';
import { Order } from '../../../domain/aggregates/order';
import { IOrderRepository } from '../../../domain/repositories/iorder-repository';
import { OrderItemEntity } from '../entities/order-item.entity';
import { OrderEntity } from '../entities/order.entity';
import { OrderMapper } from '../mappers/order.mapper';

@Injectable()
export class OrderRepository
  extends BaseRepository<OrderEntity, Order>
  implements IOrderRepository {
  constructor(
    @Inject(DataSource)
    dataSource: DataSource,
    @Inject(UnitOfWorkContextService)
    uowContextService: UnitOfWorkContextService,
    @Inject(EventBus)
    eventBus: EventBus,
    @Inject(EventBusService)
    outboxEventBus: EventBusService,
  ) {
    super(dataSource, uowContextService, eventBus, outboxEventBus);
  }

  /**
   * Implementation of doSave() - persists the order entity
   * Called by base save() method within a transaction
   */
  protected async doSave(order: Order, manager: EntityManager): Promise<void> {
    const orderRepo = manager.getRepository(OrderEntity);
    const itemRepo = manager.getRepository(OrderItemEntity);

    // Load existing entity to preserve version for optimistic locking
    const existingEntity = await orderRepo.findOne({
      where: { id: order.id },
    });

    const entity = OrderMapper.toPersistence(order, existingEntity);

    // Delete existing items and save new ones
    await itemRepo.delete({ orderId: order.id });

    await orderRepo.save(entity);
  }

  async findById(id: string): Promise<Order | null> {
    const orderRepo = this.getRepository(OrderEntity);

    const entity = await orderRepo.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!entity) {
      return null;
    }

    try {
      return OrderMapper.toDomain(entity);
    } catch (error: any) {
      console.error(`[OrderRepository] Failed to map order ${id}:`, error.message);
      console.error(`  Error stack:`, error.stack);
      console.error(`  Shipping address:`, JSON.stringify(entity.shippingAddress));
      console.error(`  Billing address:`, JSON.stringify(entity.billingAddress));
      // Re-throw to allow handler to handle the error
      throw error;
    }
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const orderRepo = this.getRepository(OrderEntity);

    const entity = await orderRepo.findOne({
      where: { orderNumber },
      relations: ['items'],
    });

    if (!entity) {
      return null;
    }

    return OrderMapper.toDomain(entity);
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const orderRepo = this.getRepository(OrderEntity);

    const entities = await orderRepo.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });

    const orders: Order[] = [];
    for (const entity of entities) {
      try {
        const order = OrderMapper.toDomain(entity);
        orders.push(order);
      } catch (error: any) {
        console.error(`[OrderRepository] Failed to map order ${entity.orderNumber || entity.id}:`, error.message);
        console.error(`  Error stack:`, error.stack);
        console.error(`  Shipping address:`, JSON.stringify(entity.shippingAddress));
        console.error(`  Billing address:`, JSON.stringify(entity.billingAddress));
        // Skip orders that fail mapping instead of breaking the entire query
        continue;
      }
    }

    console.log(`[OrderRepository] Successfully mapped ${orders.length} out of ${entities.length} orders`);

    return orders;
  }

  async findByUserIdPaginated(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ orders: Order[]; total: number }> {
    const orderRepo = this.getRepository(OrderEntity);

    const [entities, total] = await orderRepo.findAndCount({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const orders = entities.map(entity => OrderMapper.toDomain(entity));

    return { orders, total };
  }
}
