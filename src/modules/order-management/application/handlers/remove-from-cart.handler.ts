import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { RemoveFromCartCommand } from '../commands/remove-from-cart.command';
import { ICartRepository } from '../../domain/repositories/icart-repository';

@CommandHandler(RemoveFromCartCommand)
export class RemoveFromCartCommandHandler
  implements ICommandHandler<RemoveFromCartCommand>
{
  constructor(
    @Inject('ICartRepository')
    private readonly cartRepository: ICartRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RemoveFromCartCommand): Promise<void> {
    const { userId, itemId } = command;

    // Find cart
    const cart = await this.cartRepository.findActiveByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Remove item
    cart.removeItem(itemId);

    // Save cart
    await this.cartRepository.save(cart);

    // Publish domain events
    const events = cart.getDomainEvents();
    events.forEach(event => this.eventBus.publish(event));
    cart.clearDomainEvents();
  }
}

