import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../domain/aggregates/order';
import { IOrderRepository } from '../../domain/repositories/iorder-repository';
import { OrderEntity } from '../../infrastructure/persistence/entities/order.entity';
import { OrderDto } from '../dtos/order.dto';
import { GetOrderByNumberQuery } from '../queries/get-order-by-number.query';

/**
 * GetOrderByNumberQueryHandler
 *
 * Handles the GetOrderByNumberQuery to retrieve a single order by order number.
 * Includes authorization check to ensure the order belongs to the requesting user.
 */
@QueryHandler(GetOrderByNumberQuery)
export class GetOrderByNumberQueryHandler implements IQueryHandler<GetOrderByNumberQuery> {
    constructor(
        @Inject('IOrderRepository')
        private readonly orderRepository: IOrderRepository,
        @InjectRepository(OrderEntity)
        private readonly orderEntityRepository: Repository<OrderEntity>,
    ) { }

    async execute(query: GetOrderByNumberQuery): Promise<OrderDto> {
        const { orderNumber, userId } = query;

        console.log(`[GetOrderByNumberQueryHandler] Executing query for orderNumber: ${orderNumber}, userId: ${userId}`);

        try {
            const order = await this.orderRepository.findByOrderNumber(orderNumber);
            console.log(`[GetOrderByNumberQueryHandler] Order found: ${order ? 'yes' : 'no'}`);

            if (!order) {
                console.error(`[GetOrderByNumberQueryHandler] Order ${orderNumber} not found in repository`);
                throw new NotFoundException(`Order with number ${orderNumber} not found`);
            }

            if (order.userId !== userId) {
                console.error(`[GetOrderByNumberQueryHandler] Order ${orderNumber} belongs to user ${order.userId}, but requested by ${userId}`);
                throw new NotFoundException(`Order with number ${orderNumber} not found`);
            }

            // Fetch receipt URL from entity
            const entity = await this.orderEntityRepository.findOne({
                where: { orderNumber },
                select: ['id', 'receiptUrl'],
            });

            console.log(`[GetOrderByNumberQueryHandler] Converting order to DTO`);
            const dto = this.toDto(order, entity?.receiptUrl);
            console.log(`[GetOrderByNumberQueryHandler] Order DTO created successfully with ${dto.items.length} items`);

            return dto;
        } catch (error: any) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error(`[GetOrderByNumberQueryHandler] Error retrieving order ${orderNumber}:`, error.message);
            console.error(`  Error stack:`, error.stack);

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

