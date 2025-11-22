import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IOrderRepository } from '../../../domain/repositories/iorder-repository';
import { Order } from '../../../domain/aggregates/order';
import { OrderEntity } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';
import { OrderMapper } from '../mappers/order.mapper';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderEntityRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemEntityRepository: Repository<OrderItemEntity>,
  ) {}

  async save(order: Order): Promise<void> {
    const entity = OrderMapper.toPersistence(order);

    // Delete existing items and save new ones
    await this.orderItemEntityRepository.delete({ orderId: order.id });

    await this.orderEntityRepository.save(entity);
  }

  async findById(id: string): Promise<Order | null> {
    const entity = await this.orderEntityRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!entity) {
      return null;
    }

    return OrderMapper.toDomain(entity);
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

    return entities.map(entity => OrderMapper.toDomain(entity));
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

