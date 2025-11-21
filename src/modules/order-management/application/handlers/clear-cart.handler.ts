import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { ClearCartCommand } from '../commands/clear-cart.command';
import { ICartRepository } from '../../domain/repositories/icart-repository';

@CommandHandler(ClearCartCommand)
export class ClearCartCommandHandler
  implements ICommandHandler<ClearCartCommand>
{
  constructor(
    @Inject('ICartRepository')
    private readonly cartRepository: ICartRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ClearCartCommand): Promise<void> {
    const { userId } = command;

    // Find cart
    const cart = await this.cartRepository.findActiveByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Clear cart
    cart.clear();

    // Save cart
    await this.cartRepository.save(cart);

    // Publish domain events
    const events = cart.getDomainEvents();
    events.forEach(event => this.eventBus.publish(event));
    cart.clearDomainEvents();
  }
}

