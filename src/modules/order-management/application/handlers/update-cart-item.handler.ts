import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UpdateCartItemCommand } from '../commands/update-cart-item.command';
import { ICartRepository } from '../../domain/repositories/icart-repository';

@CommandHandler(UpdateCartItemCommand)
export class UpdateCartItemCommandHandler
  implements ICommandHandler<UpdateCartItemCommand>
{
  constructor(
    @Inject('ICartRepository')
    private readonly cartRepository: ICartRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateCartItemCommand): Promise<void> {
    const { userId, itemId, quantity } = command;

    // Find cart
    const cart = await this.cartRepository.findActiveByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Update item quantity
    cart.updateItemQuantity(itemId, quantity);

    // Save cart
    await this.cartRepository.save(cart);

    // Publish domain events
    const events = cart.getDomainEvents();
    events.forEach(event => this.eventBus.publish(event));
    cart.clearDomainEvents();
  }
}

