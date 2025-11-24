import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '../../../../shared/application/pagination.dto';
import { Order } from '../../domain/aggregates/order';
import { IOrderRepository } from '../../domain/repositories/iorder-repository';
import { OrderEntity } from '../../infrastructure/persistence/entities/order.entity';
import { OrderDto } from '../dtos/order.dto';
import { GetOrderHistoryQuery } from '../queries/get-order-history.query';

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
    @InjectRepository(OrderEntity)
    private readonly orderEntityRepository: Repository<OrderEntity>,
  ) { }

  async execute(query: GetOrderHistoryQuery): Promise<PaginatedResponse<OrderDto>> {
    let { userId, page, limit } = query;

    // Ensure page and limit are valid numbers with defaults
    page = page && !isNaN(Number(page)) ? Number(page) : 1;
    limit = limit && !isNaN(Number(limit)) ? Number(limit) : 10;

    // Validate pagination parameters
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    console.log('[GetOrderHistoryQueryHandler] Executing query for userId:', userId);
    console.log('[GetOrderHistoryQueryHandler] Pagination params:', { page, limit });

    // Fetch all orders for the user
    const orders = await this.orderRepository.findByUserId(userId);

    console.log('[GetOrderHistoryQueryHandler] Found orders count:', orders.length);

    // Sort by creation date descending (newest first)
    const sortedOrders = orders.sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

    console.log('[GetOrderHistoryQueryHandler] Pagination:', {
      total: sortedOrders.length,
      startIndex,
      endIndex,
      paginatedCount: paginatedOrders.length,
    });

    // Fetch receipt URLs from entities for paginated orders
    const receiptUrlMap = new Map<string, string | undefined>();
    if (paginatedOrders.length > 0) {
      const orderIds = paginatedOrders.map(order => order.id);
      const orderEntities = await this.orderEntityRepository.find({
        where: orderIds.map(id => ({ id })),
        select: ['id', 'receiptUrl'],
      });
      orderEntities.forEach(entity => {
        receiptUrlMap.set(entity.id, entity.receiptUrl);
      });
    }

    // Convert to DTOs with receipt URLs
    const orderDtos = paginatedOrders
      .map(order => {
        try {
          return this.toDto(order, receiptUrlMap.get(order.id));
        } catch (error: any) {
          console.error(`[GetOrderHistoryQueryHandler] Failed to convert order ${order.id} to DTO:`, error.message);
          console.error(`  Error stack:`, error.stack);
          console.error(`  Order data:`, {
            id: order.id,
            orderNumber: order.orderNumber?.value,
            userId: order.userId,
            itemsCount: order.items?.length,
          });
          return null;
        }
      })
      .filter(dto => dto !== null) as OrderDto[];

    console.log(`[GetOrderHistoryQueryHandler] Successfully converted ${orderDtos.length} orders to DTOs`);

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

