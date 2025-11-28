import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UnitOfWorkContext } from '@shared/infrastructure/uow/unit-of-work.context';
import { EntityManager, Repository } from 'typeorm';
import { Order } from '../../../domain/aggregates/order';
import { IOrderRepository } from '../../../domain/repositories/iorder-repository';
import { OrderItemEntity } from '../entities/order-item.entity';
import { OrderEntity } from '../entities/order.entity';
import { OrderMapper } from '../mappers/order.mapper';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderEntityRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemEntityRepository: Repository<OrderItemEntity>,
  ) { }

  async save(order: Order, manager?: EntityManager): Promise<void> {
    const entity = OrderMapper.toPersistence(order);
    const orderRepo = manager ? manager.getRepository(OrderEntity) : this.orderEntityRepository;
    const itemRepo = manager ? manager.getRepository(OrderItemEntity) : this.orderItemEntityRepository;

    // Delete existing items and save new ones
    await itemRepo.delete({ orderId: order.id });

    await orderRepo.save(entity);

    // Collect domain events from aggregate and add to UnitOfWorkContext
    if (manager?.queryRunner) {
      const context = UnitOfWorkContext.getOrCreate(manager.queryRunner);
      const events = order.getDomainEvents();
      if (events.length > 0) {
        context.addEvents(events);
        order.clearDomainEvents();
      }
    }
  }

  async findById(id: string, manager?: EntityManager): Promise<Order | null> {
    const repo = manager ? manager.getRepository(OrderEntity) : this.orderEntityRepository;
    const entity = await repo.findOne({
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
    const entity = await this.orderEntityRepository.findOne({
      where: { orderNumber },
      relations: ['items'],
    });

    if (!entity) {
      return null;
    }

    return OrderMapper.toDomain(entity);
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const entities = await this.orderEntityRepository.find({
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
    const [entities, total] = await this.orderEntityRepository.findAndCount({
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

