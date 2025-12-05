import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetCartQuery } from '../queries/get-cart.query';
import { CART_REPOSITORY_TOKEN } from '../../domain/repositories/repository.tokens';
import { ICartRepository } from '../../domain/repositories/icart-repository';
import { CartDto } from '../dtos/cart.dto';
import { CartItemDto } from '../dtos/cart-item.dto';

@QueryHandler(GetCartQuery)
export class GetCartQueryHandler implements IQueryHandler<GetCartQuery> {
  constructor(
    @Inject(CART_REPOSITORY_TOKEN)
    private readonly cartRepository: ICartRepository,
  ) {}

  async execute(query: GetCartQuery): Promise<CartDto | null> {
    const { userId } = query;

    const cart = await this.cartRepository.findActiveByUserId(userId);

    if (!cart) {
      return null;
    }

    // Map to DTO
    const cartDto = new CartDto();
    cartDto.id = cart.id;
    cartDto.userId = cart.userId;
    cartDto.status = cart.status.value;
    cartDto.items = cart.items.map(item => {
      const itemDto = new CartItemDto();
      itemDto.id = item.id;
      itemDto.productId = item.productId;
      itemDto.productName = item.productName;
      itemDto.sku = item.sku;
      itemDto.quantity = item.quantity;
      itemDto.unitPrice = item.unitPrice;
      itemDto.currency = item.currency;
      itemDto.lineTotal = item.lineTotal;
      return itemDto;
    });
    cartDto.totalAmount = cart.totalAmount;
    cartDto.itemCount = cart.itemCount;
    cartDto.createdAt = cart.createdAt;
    cartDto.updatedAt = cart.updatedAt;

    return cartDto;
  }
}

