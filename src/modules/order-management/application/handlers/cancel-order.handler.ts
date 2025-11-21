import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { CancelOrderCommand } from '../commands/cancel-order.command';
import { IOrderRepository } from '../../domain/repositories/iorder-repository';

@CommandHandler(CancelOrderCommand)
export class CancelOrderCommandHandler
  implements ICommandHandler<CancelOrderCommand>
{
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CancelOrderCommand): Promise<void> {
    const { userId, orderId, reason } = command;

    // Find order
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('Order does not belong to user');
    }

    // Cancel order
    order.cancel(reason);

    // Save order
    await this.orderRepository.save(order);

    // Publish domain events
    const events = order.getDomainEvents();
    events.forEach(event => this.eventBus.publish(event));
    order.clearDomainEvents();
  }
}

