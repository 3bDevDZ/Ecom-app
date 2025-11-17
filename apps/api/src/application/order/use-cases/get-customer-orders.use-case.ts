import { Injectable, Inject } from '@nestjs/common';
import type { IOrderRepository } from '../../../domain/order/repositories/order.repository.interface';
import { ORDER_REPOSITORY } from '../../../infrastructure/tokens';
import { OrderResponseDto } from '../dtos/order.dto';

/**
 * Get Customer Orders Use Case
 */
@Injectable()
export class GetCustomerOrdersUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orderRepository: IOrderRepository) {}

  async execute(customerId: string): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.findByCustomerId(customerId);
    return orders.map((order) => order.toJSON() as OrderResponseDto);
  }
}
