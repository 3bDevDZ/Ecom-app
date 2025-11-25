import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { ICartRepository } from '../../domain/repositories/icart-repository';
import { UpdateCartItemCommand } from '../commands/update-cart-item.command';
import { CartDto } from '../dtos/cart.dto';

@CommandHandler(UpdateCartItemCommand)
export class UpdateCartItemCommandHandler
  implements ICommandHandler<UpdateCartItemCommand>
{
  constructor(
    @Inject('ICartRepository')
    private readonly cartRepository: ICartRepository,
    private readonly eventBus: EventBus,
  ) { }

  async execute(command: UpdateCartItemCommand): Promise<CartDto> {
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

    // Return updated cart as DTO
    const updatedCart = await this.cartRepository.findActiveByUserId(userId);
    if (!updatedCart) {
      throw new Error('Cart not found after update');
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

