import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetOrderHistoryQuery } from '../queries/get-order-history.query';
import { OrderDto } from '../dtos/order.dto';
import { IOrderRepository } from '../../domain/repositories/iorder-repository';
import { PaginatedResponse } from '../../../../shared/application/pagination.dto';
import { Order } from '../../domain/aggregates/order';

/**
 * GetOrderHistoryQueryHandler
 *
 * Handles the GetOrderHistoryQuery to retrieve paginated order history for a user.
 * Orders are sorted by creation date in descending order (newest first).
 */
@QueryHandler(GetOrderHistoryQuery)
export class GetOrderHistoryQueryHandler implements IQueryHandler<GetOrderHistoryQuery> {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(query: GetOrderHistoryQuery): Promise<PaginatedResponse<OrderDto>> {
    const { userId, page, limit } = query;

    // Fetch all orders for the user
    const orders = await this.orderRepository.findByUserId(userId);

    // Sort by creation date descending (newest first)
    const sortedOrders = orders.sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

    // Convert to DTOs
    const orderDtos = paginatedOrders.map(order => this.toDto(order));

    const totalPages = Math.ceil(orders.length / limit);

    return {
      data: orderDtos,
      total: orders.length,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
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

