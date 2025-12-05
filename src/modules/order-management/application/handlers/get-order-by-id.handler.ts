import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../domain/aggregates/order';
import { ORDER_REPOSITORY_TOKEN } from '../../domain/repositories/repository.tokens';
import { IOrderRepository } from '../../domain/repositories/iorder-repository';
import { OrderEntity } from '../../infrastructure/persistence/entities/order.entity';
import { OrderDto } from '../dtos/order.dto';
import { GetOrderByIdQuery } from '../queries/get-order-by-id.query';

/**
 * GetOrderByIdQueryHandler
 *
 * Handles the GetOrderByIdQuery to retrieve a single order by ID.
 * Includes authorization check to ensure the order belongs to the requesting user.
 */
@QueryHandler(GetOrderByIdQuery)
export class GetOrderByIdQueryHandler implements IQueryHandler<GetOrderByIdQuery> {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepository: IOrderRepository,
    @InjectRepository(OrderEntity)
    private readonly orderEntityRepository: Repository<OrderEntity>,
  ) { }

  async execute(query: GetOrderByIdQuery): Promise<OrderDto> {
    const { orderId, userId } = query;

    console.log(`[GetOrderByIdQueryHandler] Executing query for orderId: ${orderId}, userId: ${userId}`);

    try {
      const order = await this.orderRepository.findById(orderId);
      console.log(`[GetOrderByIdQueryHandler] Order found: ${order ? 'yes' : 'no'}`);

      if (!order) {
        console.error(`[GetOrderByIdQueryHandler] Order ${orderId} not found in repository`);
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      if (order.userId !== userId) {
        console.error(`[GetOrderByIdQueryHandler] Order ${orderId} belongs to user ${order.userId}, but requested by ${userId}`);
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      // Fetch receipt URL from entity
      const entity = await this.orderEntityRepository.findOne({
        where: { id: orderId },
        select: ['id', 'receiptUrl'],
      });

      console.log(`[GetOrderByIdQueryHandler] Converting order to DTO`);
      const dto = this.toDto(order, entity?.receiptUrl);
      console.log(`[GetOrderByIdQueryHandler] Order DTO created successfully with ${dto.items.length} items`);

      return dto;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`[GetOrderByIdQueryHandler] Error retrieving order ${orderId}:`, error.message);
      console.error(`  Error stack:`, error.stack);
      console.error(`  Error name:`, error.name);
      console.error(`  Error constructor:`, error.constructor?.name);

      // Re-throw the original error if it's a domain/validation error
      // This will help us see the actual error
      throw error;
    }
  }

  /**
   * Transform Order domain entity to OrderDto
   */
  private toDto(order: Order, receiptUrl?: string): OrderDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber.value,
      userId: order.userId,
      status: order.status.value,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        currency: item.currency,
        lineTotal: item.lineTotal,
      })),
      shippingAddress: {
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
        contactName: order.shippingAddress.contactName || '',
        contactPhone: order.shippingAddress.contactPhone || '',
      },
      billingAddress: {
        street: order.billingAddress.street,
        city: order.billingAddress.city,
        state: order.billingAddress.state,
        postalCode: order.billingAddress.postalCode,
        country: order.billingAddress.country,
        contactName: order.billingAddress.contactName || '',
        contactPhone: order.billingAddress.contactPhone || '',
      },
      totalAmount: order.totalAmount,
      itemCount: order.itemCount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      receiptUrl,
    };
  }
}

