import { Injectable } from '@nestjs/common';
import { IOrderRepository } from '../../../domain/order/repositories/order.repository.interface';
import { OrderResponseDto } from '../dtos/order.dto';

/**
 * Get Customer Orders Use Case
 */
@Injectable()
export class GetCustomerOrdersUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(customerId: string): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.findByCustomerId(customerId);
    return orders.map((order) => order.toJSON() as OrderResponseDto);
  }
}
