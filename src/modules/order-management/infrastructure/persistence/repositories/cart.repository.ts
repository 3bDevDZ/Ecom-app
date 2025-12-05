import { Inject, Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { DataSource, EntityManager } from 'typeorm';
import { EventBusService } from '../../../../../shared/event/event-bus.service';
import { BaseRepository } from '../../../../../shared/infrastructure/database/base.repository';
import { UnitOfWorkContextService } from '../../../../../shared/infrastructure/uow/uow-context.service';
import { Cart } from '../../../domain/aggregates/cart';
import { ICartRepository } from '../../../domain/repositories/icart-repository';
import { CartItemEntity } from '../entities/cart-item.entity';
import { CartEntity } from '../entities/cart.entity';
import { CartMapper } from '../mappers/cart.mapper';

@Injectable()
export class CartRepository
  extends BaseRepository<CartEntity, Cart>
  implements ICartRepository {
  constructor(
    @Inject(DataSource)
    dataSource: DataSource,
    @Inject(UnitOfWorkContextService)
    uowContextService: UnitOfWorkContextService,
    @Inject(EventBus)
    eventBus: EventBus,
    @Inject(EventBusService)
    outboxEventBus: EventBusService,
  ) {
    super(dataSource, uowContextService, eventBus, outboxEventBus);
  }

  /**
   * Implementation of doSave() - persists the cart entity
   * Called by base save() method within a transaction
   */
  protected async doSave(cart: Cart, manager: EntityManager): Promise<void> {
    const cartRepo = manager.getRepository(CartEntity);
    const itemRepo = manager.getRepository(CartItemEntity);

    // Check if cart already exists to preserve expiresAt
    const existingEntity = await cartRepo.findOne({
      where: { id: cart.id },
    });

    const entity = CartMapper.toPersistence(cart, existingEntity || undefined);

    // Delete existing items and save new ones (simplest approach for cart items)
    await itemRepo.delete({ cartId: cart.id });

    await cartRepo.save(entity);
  }

  async findById(id: string): Promise<Cart | null> {
    const cartRepo = this.getRepository(CartEntity);

    const entity = await cartRepo.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!entity) {
      return null;
    }

    return CartMapper.toDomain(entity);
  }

  async findActiveByUserId(userId: string): Promise<Cart | null> {
    const cartRepo = this.getRepository(CartEntity);

    const entity = await cartRepo.findOne({
      where: { userId, status: 'active' },
      relations: ['items'],
    });

    if (!entity) {
      return null;
    }

    return CartMapper.toDomain(entity);
  }

  async delete(id: string): Promise<void> {
    const cartRepo = this.getRepository(CartEntity);
    await cartRepo.delete(id);
  }
}
