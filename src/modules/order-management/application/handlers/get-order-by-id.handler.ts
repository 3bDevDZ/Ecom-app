import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetOrderByIdQuery } from '../queries/get-order-by-id.query';
import { OrderDto } from '../dtos/order.dto';
import { IOrderRepository } from '../../domain/repositories/iorder-repository';
import { Order } from '../../domain/aggregates/order';

/**
 * GetOrderByIdQueryHandler
 *
 * Handles the GetOrderByIdQuery to retrieve a single order by ID.
 * Includes authorization check to ensure the order belongs to the requesting user.
 */
@QueryHandler(GetOrderByIdQuery)
export class GetOrderByIdQueryHandler implements IQueryHandler<GetOrderByIdQuery> {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(query: GetOrderByIdQuery): Promise<OrderDto> {
    const { orderId, userId } = query;

    const order = await this.orderRepository.findById(orderId);

    if (!order || order.userId !== userId) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return this.toDto(order);
  }

  /**
   * Transform Order domain entity to OrderDto
   */
  private toDto(order: Order): OrderDto {
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
        contactName: '',
        contactPhone: '',
      },
      billingAddress: {
        street: order.billingAddress.street,
        city: order.billingAddress.city,
        state: order.billingAddress.state,
        postalCode: order.billingAddress.postalCode,
        country: order.billingAddress.country,
        contactName: '',
        contactPhone: '',
      },
      totalAmount: order.totalAmount,
      itemCount: order.itemCount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}

