import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UnitOfWorkContext } from '@shared/infrastructure/uow/unit-of-work.context';
import { EntityManager, Repository } from 'typeorm';
import { Cart } from '../../../domain/aggregates/cart';
import { ICartRepository } from '../../../domain/repositories/icart-repository';
import { CartItemEntity } from '../entities/cart-item.entity';
import { CartEntity } from '../entities/cart.entity';
import { CartMapper } from '../mappers/cart.mapper';

@Injectable()
export class CartRepository implements ICartRepository {
  constructor(
    @InjectRepository(CartEntity)
    private readonly cartEntityRepository: Repository<CartEntity>,
    @InjectRepository(CartItemEntity)
    private readonly cartItemEntityRepository: Repository<CartItemEntity>,
  ) { }

  async save(cart: Cart, manager?: EntityManager): Promise<void> {
    const cartRepo = manager ? manager.getRepository(CartEntity) : this.cartEntityRepository;
    const itemRepo = manager ? manager.getRepository(CartItemEntity) : this.cartItemEntityRepository;

    // Check if cart already exists to preserve expiresAt
    const existingEntity = await cartRepo.findOne({
      where: { id: cart.id },
    });

    const entity = CartMapper.toPersistence(cart, existingEntity || undefined);

    // Delete existing items and save new ones (simplest approach for cart items)
    await itemRepo.delete({ cartId: cart.id });

    await cartRepo.save(entity);

    // Collect domain events from aggregate and add to UnitOfWorkContext
    if (manager?.queryRunner) {
      const context = UnitOfWorkContext.getOrCreate(manager.queryRunner);
      const events = cart.getDomainEvents();
      if (events.length > 0) {
        context.addEvents(events);
        cart.clearDomainEvents();
      }
    }
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

  async findActiveByUserId(userId: string, manager?: EntityManager): Promise<Cart | null> {
    const repo = manager ? manager.getRepository(CartEntity) : this.cartEntityRepository;
    const entity = await repo.findOne({
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

