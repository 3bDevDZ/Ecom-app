import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICartRepository } from '../../../domain/repositories/icart-repository';
import { Cart } from '../../../domain/aggregates/cart';
import { CartEntity } from '../entities/cart.entity';
import { CartItemEntity } from '../entities/cart-item.entity';
import { CartMapper } from '../mappers/cart.mapper';

@Injectable()
export class CartRepository implements ICartRepository {
  constructor(
    @InjectRepository(CartEntity)
    private readonly cartEntityRepository: Repository<CartEntity>,
    @InjectRepository(CartItemEntity)
    private readonly cartItemEntityRepository: Repository<CartItemEntity>,
  ) {}

  async save(cart: Cart): Promise<void> {
    // Check if cart already exists to preserve expiresAt
    const existingEntity = await this.cartEntityRepository.findOne({
      where: { id: cart.id },
    });

    const entity = CartMapper.toPersistence(cart, existingEntity || undefined);

    // Delete existing items and save new ones (simplest approach for cart items)
    await this.cartItemEntityRepository.delete({ cartId: cart.id });

    await this.cartEntityRepository.save(entity);
  }

  async findById(id: string): Promise<Cart | null> {
    const entity = await this.cartEntityRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!entity) {
      return null;
    }

    return CartMapper.toDomain(entity);
  }

  async findActiveByUserId(userId: string): Promise<Cart | null> {
    const entity = await this.cartEntityRepository.findOne({
      where: { userId, status: 'active' },
      relations: ['items'],
    });

    if (!entity) {
      return null;
    }

    return CartMapper.toDomain(entity);
  }

  async delete(id: string): Promise<void> {
    await this.cartEntityRepository.delete(id);
  }
}

