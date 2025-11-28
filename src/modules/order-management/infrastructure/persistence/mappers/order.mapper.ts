import { Order } from '../../../domain/aggregates/order';
import { OrderItem } from '../../../domain/entities/order-item';
import { OrderNumber } from '../../../domain/value-objects/order-number';
import { OrderStatus } from '../../../domain/value-objects/order-status';
import { Address } from '../../../domain/value-objects/address';
import { OrderEntity } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';

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

  static toPersistence(order: Order): OrderEntity {
    const entity = new OrderEntity();
    entity.id = order.id;
    entity.orderNumber = order.orderNumber.value;
    entity.userId = order.userId;
    entity.cartId = order.cartId;
    entity.status = order.status.value;
    entity.createdAt = order.createdAt;
    entity.updatedAt = order.updatedAt;
    entity.deliveredAt = order.deliveredAt;
    entity.cancellationReason = order.cancellationReason;

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

    // Calculate financial values
    // Subtotal is the sum of all item line totals
    entity.subtotal = order.items.reduce((sum, item) => sum + item.lineTotal, 0);

    // Tax is 8% of subtotal (matching CartPresenter calculation)
    entity.tax = entity.subtotal * 0.08;

    // Shipping is free over $500, otherwise $25 (matching CartPresenter calculation)
    entity.shipping = entity.subtotal >= 500 ? 0 : 25.0;

    // Discount is not currently used, but can be set in the future
    entity.discount = null;

    // Total is subtotal + tax + shipping - discount
    entity.total = entity.subtotal + entity.tax + entity.shipping - (entity.discount || 0);

    // Currency from first item (all items should have the same currency)
    entity.currency = order.items.length > 0 ? order.items[0].currency : 'USD';

    entity.items = order.items.map(item => {
      const itemEntity = new OrderItemEntity();
      itemEntity.id = item.id;
      itemEntity.orderId = order.id;
      itemEntity.productId = item.productId;
      itemEntity.productName = item.productName;
      itemEntity.sku = item.sku;
      itemEntity.quantity = item.quantity;
      itemEntity.unitPrice = item.unitPrice;
      itemEntity.subtotal = item.lineTotal; // lineTotal = quantity * unitPrice
      itemEntity.currency = item.currency;
      return itemEntity;
    });

    return entity;
  }
}

