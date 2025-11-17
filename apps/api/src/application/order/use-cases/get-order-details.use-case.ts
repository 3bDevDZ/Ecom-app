import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import type { IOrderRepository } from '../../../domain/order/repositories/order.repository.interface';
import { ORDER_REPOSITORY } from '../../../infrastructure/tokens';
import { OrderResponseDto } from '../dtos/order.dto';

/**
 * Get Order Details Use Case
 * Application service that orchestrates the retrieval of order details
 */
@Injectable()
export class GetOrderDetailsUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orderRepository: IOrderRepository) {}

  async execute(orderId: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return order.toJSON() as OrderResponseDto;
  }
}
