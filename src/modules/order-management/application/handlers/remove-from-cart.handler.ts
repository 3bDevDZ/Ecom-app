import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CART_REPOSITORY_TOKEN } from '../../domain/repositories/repository.tokens';
import { ICartRepository } from '../../domain/repositories/icart-repository';
import { RemoveFromCartCommand } from '../commands/remove-from-cart.command';
import { CartDto } from '../dtos/cart.dto';

@CommandHandler(RemoveFromCartCommand)
export class RemoveFromCartCommandHandler
  implements ICommandHandler<RemoveFromCartCommand>
{
  constructor(
    @Inject(CART_REPOSITORY_TOKEN)
    private readonly cartRepository: ICartRepository,
    private readonly eventBus: EventBus,
  ) { }

  async execute(command: RemoveFromCartCommand): Promise<CartDto> {
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

    // Return updated cart as DTO
    const updatedCart = await this.cartRepository.findActiveByUserId(userId);
    if (!updatedCart) {
      // Cart might be empty now, return empty cart DTO
      return {
        id: null,
        userId: userId,
        status: 'active',
        items: [],
        totalAmount: 0,
        itemCount: 0,
        createdAt: null,
        updatedAt: null,
      } as CartDto;
    }

    const cartDto = new CartDto();
    cartDto.id = updatedCart.id;
    cartDto.userId = updatedCart.userId;
    cartDto.status = updatedCart.status.value;
    cartDto.items = updatedCart.items.map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      currency: item.currency,
      lineTotal: item.lineTotal,
    }));
    cartDto.totalAmount = updatedCart.totalAmount;
    cartDto.itemCount = updatedCart.itemCount;
    cartDto.createdAt = updatedCart.createdAt;
    cartDto.updatedAt = updatedCart.updatedAt;

    return cartDto;
  }
}

