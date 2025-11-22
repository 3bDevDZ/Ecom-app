import { Cart } from '../../../domain/aggregates/cart';
import { CartItem } from '../../../domain/entities/cart-item';
import { CartStatus } from '../../../domain/value-objects/cart-status';
import { CartEntity } from '../entities/cart.entity';
import { CartItemEntity } from '../entities/cart-item.entity';

export class CartMapper {
  static toDomain(entity: CartEntity): Cart {
    const items = entity.items.map(itemEntity =>
      CartItem.reconstitute({
        id: itemEntity.id,
        productId: itemEntity.productId,
        productName: itemEntity.productName,
        sku: itemEntity.sku,
        quantity: itemEntity.quantity,
        unitPrice: Number(itemEntity.unitPrice),
        currency: itemEntity.currency,
      }),
    );

    return Cart.reconstitute(
      entity.id,
      entity.userId,
      CartStatus.fromString(entity.status),
      items,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  static toPersistence(cart: Cart): CartEntity {
    const entity = new CartEntity();
    entity.id = cart.id;
    entity.userId = cart.userId;
    entity.status = cart.status.value;
    entity.createdAt = cart.createdAt;
    entity.updatedAt = cart.updatedAt;

    entity.items = cart.items.map(item => {
      const itemEntity = new CartItemEntity();
      itemEntity.id = item.id;
      itemEntity.cartId = cart.id;
      itemEntity.productId = item.productId;
      itemEntity.productName = item.productName;
      itemEntity.sku = item.sku;
      itemEntity.quantity = item.quantity;
      itemEntity.unitPrice = item.unitPrice;
      itemEntity.currency = item.currency;
      return itemEntity;
    });

    return entity;
  }
}

