import { Order } from '../../../domain/aggregates/order';
import { OrderItem } from '../../../domain/entities/order-item';
import { Address } from '../../../domain/value-objects/address';
import { OrderNumber } from '../../../domain/value-objects/order-number';
import { OrderStatus } from '../../../domain/value-objects/order-status';
import { OrderItemEntity } from '../entities/order-item.entity';
import { OrderEntity } from '../entities/order.entity';

export class OrderMapper {
  static toDomain(entity: OrderEntity): Order {
    const items = entity.items.map(itemEntity =>
      OrderItem.reconstitute({
        id: itemEntity.id,
        productId: itemEntity.productId,
        productName: itemEntity.productName,
        sku: itemEntity.sku,
        quantity: itemEntity.quantity,
        unitPrice: Number(itemEntity.unitPrice),
        currency: itemEntity.currency,
      }),
    );

    const shippingAddress = Address.create({
      street: entity.shippingAddress.street,
      city: entity.shippingAddress.city,
      state: entity.shippingAddress.state,
      postalCode: entity.shippingAddress.postalCode,
      country: entity.shippingAddress.country,
      contactName: entity.shippingAddress.contactName,
      contactPhone: entity.shippingAddress.contactPhone,
    });

    const billingAddress = Address.create({
      street: entity.billingAddress.street,
      city: entity.billingAddress.city,
      state: entity.billingAddress.state,
      postalCode: entity.billingAddress.postalCode,
      country: entity.billingAddress.country,
      contactName: entity.billingAddress.contactName,
      contactPhone: entity.billingAddress.contactPhone,
    });

    return Order.reconstitute(
      entity.id,
      OrderNumber.create(entity.orderNumber),
      entity.userId,
      entity.cartId,
      OrderStatus.fromString(entity.status),
      items,
      shippingAddress,
      billingAddress,
      entity.createdAt,
      entity.updatedAt,
      entity.cancellationReason,
      entity.deliveredAt,
    );
  }

  static toPersistence(order: Order, existingEntity?: OrderEntity): OrderEntity {
    const entity = existingEntity || new OrderEntity();
    entity.id = order.id;
    entity.orderNumber = order.orderNumber.value;
    entity.userId = order.userId;
    entity.cartId = order.cartId;
    entity.status = order.status.value;
    entity.createdAt = order.createdAt;
    entity.updatedAt = order.updatedAt;
    entity.deliveredAt = order.deliveredAt;
    entity.cancellationReason = order.cancellationReason;
    // Preserve version for optimistic locking (TypeORM will auto-increment on save)
    if (existingEntity?.version !== undefined) {
      entity.version = existingEntity.version;
    }

    // Calculate financial fields
    const subtotal = order.items.reduce((sum, item) => sum + item.lineTotal, 0);
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal >= 500 ? 0 : 25.0; // Free shipping over $500
    const total = subtotal + tax + shipping;
    const currency = order.items.length > 0 ? order.items[0].currency : 'USD';

    entity.subtotal = subtotal;
    entity.tax = tax;
    entity.shipping = shipping;
    entity.discount = 0; // Can be set if discounts are implemented
    entity.total = total;
    entity.currency = currency;

    entity.shippingAddress = {
      street: order.shippingAddress.street,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      postalCode: order.shippingAddress.postalCode,
      country: order.shippingAddress.country,
      contactName: order.shippingAddress.contactName,
      contactPhone: order.shippingAddress.contactPhone,
    };

    entity.billingAddress = {
      street: order.billingAddress.street,
      city: order.billingAddress.city,
      state: order.billingAddress.state,
      postalCode: order.billingAddress.postalCode,
      country: order.billingAddress.country,
      contactName: order.billingAddress.contactName,
      contactPhone: order.billingAddress.contactPhone,
    };

    entity.items = order.items.map(item => {
      const itemEntity = new OrderItemEntity();
      itemEntity.id = item.id;
      itemEntity.orderId = order.id;
      itemEntity.productId = item.productId;
      itemEntity.productName = item.productName;
      itemEntity.sku = item.sku;
      itemEntity.quantity = item.quantity;
      itemEntity.unitPrice = item.unitPrice;
      itemEntity.subtotal = item.lineTotal; // quantity * unitPrice
      itemEntity.currency = item.currency;
      return itemEntity;
    });

    return entity;
  }
}

