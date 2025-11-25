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

  static toPersistence(cart: Cart, existingEntity?: CartEntity): CartEntity {
    const entity = existingEntity || new CartEntity();
    entity.id = cart.id;
    entity.userId = cart.userId;
    entity.status = cart.status.value;
    entity.createdAt = cart.createdAt;
    entity.updatedAt = cart.updatedAt;

    // Set expiresAt: 7 days from creation for new carts, preserve existing for updates
    if (existingEntity?.expiresAt) {
      // Preserve existing expiresAt when updating
      entity.expiresAt = existingEntity.expiresAt;
    } else {
      // New cart: calculate 7 days from creation
      const expiresAt = new Date(cart.createdAt || new Date());
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from creation
      entity.expiresAt = expiresAt;
    }

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

