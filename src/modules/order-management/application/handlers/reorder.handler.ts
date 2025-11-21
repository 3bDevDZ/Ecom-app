import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ReorderCommand } from '../commands/reorder.command';
import { IOrderRepository } from '../../domain/repositories/iorder-repository';
import { ICartRepository } from '../../domain/repositories/icart-repository';
import { Cart } from '../../domain/aggregates/cart';
import { CartItem } from '../../domain/entities/cart-item';

/**
 * ReorderCommandHandler
 *
 * Handles the ReorderCommand to recreate a cart from a previous order.
 * All items from the order are added to a new or existing cart.
 */
@CommandHandler(ReorderCommand)
export class ReorderCommandHandler implements ICommandHandler<ReorderCommand> {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('ICartRepository')
    private readonly cartRepository: ICartRepository,
  ) {}

  async execute(command: ReorderCommand): Promise<string> {
    const { userId, orderId } = command;

    // Find the original order
    const order = await this.orderRepository.findById(orderId);

    if (!order || order.userId !== userId) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Get or create cart for user
    let cart = await this.cartRepository.findActiveByUserId(userId);

    if (!cart) {
      cart = Cart.create(userId);
    }

    // Add all items from the order to the cart
    for (const orderItem of order.items) {
      const cartItem = CartItem.create({
        id: uuidv4(),
        productId: orderItem.productId,
        productName: orderItem.productName,
        sku: orderItem.sku,
        quantity: orderItem.quantity,
        unitPrice: orderItem.unitPrice,
        currency: orderItem.currency,
      });

      cart.addItem(cartItem);
    }

    // Save the updated cart
    await this.cartRepository.save(cart);

    return cart.id;
  }
}

