# Domain & Integration Events Schema

**Feature**: B2B E-Commerce Platform MVP  
**Date**: 2025-11-18  
**Pattern**: Event-Driven Architecture with Outbox Pattern

## Event Flow

```
Domain Event (In-Process)
    ↓
Outbox Table (Transactional)
    ↓
Outbox Processor (Polling)
    ↓
RabbitMQ Exchange (ecommerce.events)
    ↓
Topic Routing (order.*, product.*, etc.)
    ↓
Queue Consumers
```

---

## Base Event Structure

All events follow this base structure:

```typescript
interface BaseEvent {
  eventId: string;          // UUID
  eventType: string;        // e.g., "order.placed"
  eventVersion: string;     // e.g., "1.0"
  aggregateId: string;      // UUID of aggregate root
  aggregateType: string;    // e.g., "Order"
  occurredAt: string;       // ISO 8601 timestamp
  correlationId?: string;   // For tracing related events
  causationId?: string;     // Event that caused this event
  metadata: {
    userId?: string;
    source: string;         // e.g., "ecommerce-api"
    environment: string;    // e.g., "production"
  };
  payload: any;             // Event-specific data
}
```

---

## Landing CMS Events

### ContentUpdated

**Routing Key**: `landing-cms.content-updated`  
**Aggregate**: LandingPageContent

```json
{
  "eventId": "uuid",
  "eventType": "landing-cms.content-updated",
  "eventVersion": "1.0",
  "aggregateId": "uuid",
  "aggregateType": "LandingPageContent",
  "occurredAt": "2025-11-18T10:00:00Z",
  "metadata": {
    "userId": "admin-uuid",
    "source": "ecommerce-api",
    "environment": "production"
  },
  "payload": {
    "section": "hero" | "trustLogos" | "productShowcase" | "showroomInfo" | "contactSection" | "footer",
    "previousVersion": 5,
    "newVersion": 6
  }
}
```

### ContentPublished

**Routing Key**: `landing-cms.content-published`  
**Aggregate**: LandingPageContent

```json
{
  "eventId": "uuid",
  "eventType": "landing-cms.content-published",
  "eventVersion": "1.0",
  "aggregateId": "uuid",
  "aggregateType": "LandingPageContent",
  "occurredAt": "2025-11-18T10:00:00Z",
  "metadata": {
    "userId": "admin-uuid",
    "source": "ecommerce-api",
    "environment": "production"
  },
  "payload": {
    "version": 6,
    "publishedBy": "admin@example.com"
  }
}
```

---

## Product Catalog Events

### ProductCreated

**Routing Key**: `product.created`  
**Aggregate**: Product

```json
{
  "eventId": "uuid",
  "eventType": "product.created",
  "eventVersion": "1.0",
  "aggregateId": "product-uuid",
  "aggregateType": "Product",
  "occurredAt": "2025-11-18T10:00:00Z",
  "metadata": {
    "userId": "admin-uuid",
    "source": "ecommerce-api",
    "environment": "production"
  },
  "payload": {
    "sku": "PROD-001",
    "name": "Product Name",
    "categoryId": "category-uuid",
    "basePrice": {
      "amount": 99.99,
      "currency": "USD"
    },
    "isActive": true
  }
}
```

### ProductUpdated

**Routing Key**: `product.updated`  
**Aggregate**: Product

```json
{
  "eventId": "uuid",
  "eventType": "product.updated",
  "eventVersion": "1.0",
  "aggregateId": "product-uuid",
  "aggregateType": "Product",
  "occurredAt": "2025-11-18T10:00:00Z",
  "metadata": {
    "userId": "admin-uuid",
    "source": "ecommerce-api",
    "environment": "production"
  },
  "payload": {
    "sku": "PROD-001",
    "changes": {
      "name": "Updated Product Name",
      "basePrice": {
        "amount": 109.99,
        "currency": "USD"
      }
    },
    "previousValues": {
      "name": "Product Name",
      "basePrice": {
        "amount": 99.99,
        "currency": "USD"
      }
    }
  }
}
```

### ProductActivated

**Routing Key**: `product.activated`  
**Aggregate**: Product

```json
{
  "eventId": "uuid",
  "eventType": "product.activated",
  "eventVersion": "1.0",
  "aggregateId": "product-uuid",
  "aggregateType": "Product",
  "occurredAt": "2025-11-18T10:00:00Z",
  "payload": {
    "sku": "PROD-001",
    "activatedBy": "admin@example.com"
  }
}
```

### ProductDeactivated

**Routing Key**: `product.deactivated`  
**Aggregate**: Product

```json
{
  "eventId": "uuid",
  "eventType": "product.deactivated",
  "eventVersion": "1.0",
  "aggregateId": "product-uuid",
  "aggregateType": "Product",
  "occurredAt": "2025-11-18T10:00:00Z",
  "payload": {
    "sku": "PROD-001",
    "reason": "Out of production",
    "deactivatedBy": "admin@example.com"
  }
}
```

---

## Inventory Events

### InventoryReserved

**Routing Key**: `inventory.reserved`  
**Aggregate**: Product/ProductVariant

```json
{
  "eventId": "uuid",
  "eventType": "inventory.reserved",
  "eventVersion": "1.0",
  "aggregateId": "product-uuid",
  "aggregateType": "Product",
  "occurredAt": "2025-11-18T10:00:00Z",
  "metadata": {
    "userId": "user-uuid",
    "source": "ecommerce-api",
    "environment": "production"
  },
  "payload": {
    "productId": "product-uuid",
    "variantId": "variant-uuid",
    "sku": "PROD-001-L-BLUE",
    "quantity": 5,
    "reservedFor": "cart" | "order",
    "referenceId": "cart-uuid or order-uuid",
    "expiresAt": "2025-11-18T10:30:00Z",
    "previousAvailable": 100,
    "newAvailable": 95
  }
}
```

### InventoryReleased

**Routing Key**: `inventory.released`  
**Aggregate**: Product/ProductVariant

```json
{
  "eventId": "uuid",
  "eventType": "inventory.released",
  "eventVersion": "1.0",
  "aggregateId": "product-uuid",
  "aggregateType": "Product",
  "occurredAt": "2025-11-18T10:00:00Z",
  "payload": {
    "productId": "product-uuid",
    "variantId": "variant-uuid",
    "sku": "PROD-001-L-BLUE",
    "quantity": 5,
    "reason": "timeout" | "cancellation" | "error",
    "referenceId": "cart-uuid or order-uuid",
    "previousAvailable": 95,
    "newAvailable": 100
  }
}
```

### InventoryRestocked

**Routing Key**: `inventory.restocked`  
**Aggregate**: Product/ProductVariant

```json
{
  "eventId": "uuid",
  "eventType": "inventory.restocked",
  "eventVersion": "1.0",
  "aggregateId": "product-uuid",
  "aggregateType": "Product",
  "occurredAt": "2025-11-18T10:00:00Z",
  "metadata": {
    "userId": "admin-uuid",
    "source": "ecommerce-api",
    "environment": "production"
  },
  "payload": {
    "productId": "product-uuid",
    "variantId": "variant-uuid",
    "sku": "PROD-001-L-BLUE",
    "quantity": 50,
    "previousAvailable": 10,
    "newAvailable": 60
  }
}
```

---

## Cart Events

### ItemAddedToCart

**Routing Key**: `order.cart.item-added`  
**Aggregate**: Cart

```json
{
  "eventId": "uuid",
  "eventType": "order.cart.item-added",
  "eventVersion": "1.0",
  "aggregateId": "cart-uuid",
  "aggregateType": "Cart",
  "occurredAt": "2025-11-18T10:00:00Z",
  "metadata": {
    "userId": "user-uuid",
    "source": "ecommerce-api",
    "environment": "production"
  },
  "payload": {
    "cartItemId": "cart-item-uuid",
    "productId": "product-uuid",
    "variantId": "variant-uuid",
    "sku": "PROD-001-L-BLUE",
    "quantity": 2,
    "unitPrice": {
      "amount": 99.99,
      "currency": "USD"
    }
  }
}
```

### ItemRemovedFromCart

**Routing Key**: `order.cart.item-removed`  
**Aggregate**: Cart

```json
{
  "eventId": "uuid",
  "eventType": "order.cart.item-removed",
  "eventVersion": "1.0",
  "aggregateId": "cart-uuid",
  "aggregateType": "Cart",
  "occurredAt": "2025-11-18T10:00:00Z",
  "metadata": {
    "userId": "user-uuid",
    "source": "ecommerce-api",
    "environment": "production"
  },
  "payload": {
    "cartItemId": "cart-item-uuid",
    "productId": "product-uuid",
    "variantId": "variant-uuid",
    "sku": "PROD-001-L-BLUE",
    "quantity": 2
  }
}
```

### ItemQuantityUpdated

**Routing Key**: `order.cart.item-quantity-updated`  
**Aggregate**: Cart

```json
{
  "eventId": "uuid",
  "eventType": "order.cart.item-quantity-updated",
  "eventVersion": "1.0",
  "aggregateId": "cart-uuid",
  "aggregateType": "Cart",
  "occurredAt": "2025-11-18T10:00:00Z",
  "metadata": {
    "userId": "user-uuid",
    "source": "ecommerce-api",
    "environment": "production"
  },
  "payload": {
    "cartItemId": "cart-item-uuid",
    "productId": "product-uuid",
    "variantId": "variant-uuid",
    "sku": "PROD-001-L-BLUE",
    "previousQuantity": 2,
    "newQuantity": 5
  }
}
```

### CartCleared

**Routing Key**: `order.cart.cleared`  
**Aggregate**: Cart

```json
{
  "eventId": "uuid",
  "eventType": "order.cart.cleared",
  "eventVersion": "1.0",
  "aggregateId": "cart-uuid",
  "aggregateType": "Cart",
  "occurredAt": "2025-11-18T10:00:00Z",
  "metadata": {
    "userId": "user-uuid",
    "source": "ecommerce-api",
    "environment": "production"
  },
  "payload": {
    "itemCount": 3,
    "reason": "user_action" | "cart_conversion" | "timeout"
  }
}
```

### CartConverted

**Routing Key**: `order.cart.converted`  
**Aggregate**: Cart

```json
{
  "eventId": "uuid",
  "eventType": "order.cart.converted",
  "eventVersion": "1.0",
  "aggregateId": "cart-uuid",
  "aggregateType": "Cart",
  "occurredAt": "2025-11-18T10:00:00Z",
  "correlationId": "order-placement-correlation-uuid",
  "metadata": {
    "userId": "user-uuid",
    "source": "ecommerce-api",
    "environment": "production"
  },
  "payload": {
    "orderId": "order-uuid",
    "orderNumber": "ORD-2025-11-000123",
    "itemCount": 3,
    "total": {
      "amount": 299.97,
      "currency": "USD"
    }
  }
}
```

---

## Order Events

### OrderPlaced

**Routing Key**: `order.placed`  
**Aggregate**: Order  
**Critical**: Triggers email notification, inventory reservation

```json
{
  "eventId": "uuid",
  "eventType": "order.placed",
  "eventVersion": "1.0",
  "aggregateId": "order-uuid",
  "aggregateType": "Order",
  "occurredAt": "2025-11-18T10:00:00Z",
  "correlationId": "order-placement-correlation-uuid",
  "metadata": {
    "userId": "user-uuid",
    "source": "ecommerce-api",
    "environment": "production"
  },
  "payload": {
    "orderNumber": "ORD-2025-11-000123",
    "userId": "user-uuid",
    "userEmail": "buyer@example.com",
    "items": [
      {
        "productId": "product-uuid",
        "variantId": "variant-uuid",
        "sku": "PROD-001-L-BLUE",
        "productName": "Product Name",
        "quantity": 2,
        "unitPrice": {
          "amount": 99.99,
          "currency": "USD"
        },
        "subtotal": {
          "amount": 199.98,
          "currency": "USD"
        }
      }
    ],
    "shippingAddress": {
      "street": "123 Business St",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94105",
      "country": "US",
      "contactName": "John Doe",
      "contactPhone": "+1-555-0123"
    },
    "poNumber": "PO-123456",
    "notes": "Deliver to loading dock",
    "subtotal": {
      "amount": 199.98,
      "currency": "USD"
    },
    "tax": {
      "amount": 20.00,
      "currency": "USD"
    },
    "shipping": {
      "amount": 10.00,
      "currency": "USD"
    },
    "discount": null,
    "total": {
      "amount": 229.98,
      "currency": "USD"
    }
  }
}
```

### OrderCancelled

**Routing Key**: `order.cancelled`  
**Aggregate**: Order  
**Critical**: Triggers inventory release, email notification

```json
{
  "eventId": "uuid",
  "eventType": "order.cancelled",
  "eventVersion": "1.0",
  "aggregateId": "order-uuid",
  "aggregateType": "Order",
  "occurredAt": "2025-11-18T10:00:00Z",
  "metadata": {
    "userId": "user-uuid",
    "source": "ecommerce-api",
    "environment": "production"
  },
  "payload": {
    "orderNumber": "ORD-2025-11-000123",
    "userId": "user-uuid",
    "userEmail": "buyer@example.com",
    "reason": "user_request" | "inventory_unavailable" | "system_error",
    "cancelledBy": "user@example.com",
    "items": [
      {
        "productId": "product-uuid",
        "variantId": "variant-uuid",
        "sku": "PROD-001-L-BLUE",
        "quantity": 2
      }
    ],
    "total": {
      "amount": 229.98,
      "currency": "USD"
    }
  }
}
```

### OrderStatusChanged

**Routing Key**: `order.status-changed`  
**Aggregate**: Order

```json
{
  "eventId": "uuid",
  "eventType": "order.status-changed",
  "eventVersion": "1.0",
  "aggregateId": "order-uuid",
  "aggregateType": "Order",
  "occurredAt": "2025-11-18T10:00:00Z",
  "metadata": {
    "source": "external-system",
    "environment": "production"
  },
  "payload": {
    "orderNumber": "ORD-2025-11-000123",
    "previousStatus": "pending",
    "newStatus": "processing",
    "updatedBy": "external-system",
    "trackingNumber": null,
    "trackingCarrier": null
  }
}
```

### OrderShipped

**Routing Key**: `order.shipped`  
**Aggregate**: Order

```json
{
  "eventId": "uuid",
  "eventType": "order.shipped",
  "eventVersion": "1.0",
  "aggregateId": "order-uuid",
  "aggregateType": "Order",
  "occurredAt": "2025-11-18T10:00:00Z",
  "metadata": {
    "source": "external-system",
    "environment": "production"
  },
  "payload": {
    "orderNumber": "ORD-2025-11-000123",
    "userId": "user-uuid",
    "userEmail": "buyer@example.com",
    "trackingNumber": "1Z999AA10123456784",
    "trackingCarrier": "UPS",
    "expectedDeliveryDate": "2025-11-22",
    "shippedAt": "2025-11-18T10:00:00Z"
  }
}
```

---

## Email Notification Events

### EmailNotificationRequested

**Routing Key**: `email.notification-requested`  
**Internal Event**: Triggers email service

```json
{
  "eventId": "uuid",
  "eventType": "email.notification-requested",
  "eventVersion": "1.0",
  "aggregateId": "order-uuid or other-uuid",
  "aggregateType": "Order",
  "occurredAt": "2025-11-18T10:00:00Z",
  "causationId": "order-placed-event-uuid",
  "metadata": {
    "source": "ecommerce-api",
    "environment": "production"
  },
  "payload": {
    "templateType": "order_confirmation" | "order_cancellation" | "order_shipped",
    "recipient": "buyer@example.com",
    "data": {
      "orderNumber": "ORD-2025-11-000123",
      "customerName": "John Doe",
      "total": "$ 229.98",
      "items": [...],
      "trackingUrl": "https://tracking.example.com/..."
    },
    "priority": "high" | "normal" | "low",
    "retryAttempts": 0,
    "maxRetries": 3
  }
}
```

### EmailSent

**Routing Key**: `email.sent`

```json
{
  "eventId": "uuid",
  "eventType": "email.sent",
  "eventVersion": "1.0",
  "aggregateId": "order-uuid",
  "aggregateType": "Order",
  "occurredAt": "2025-11-18T10:00:05Z",
  "causationId": "email-notification-requested-event-uuid",
  "payload": {
    "recipient": "buyer@example.com",
    "templateType": "order_confirmation",
    "orderNumber": "ORD-2025-11-000123",
    "sentAt": "2025-11-18T10:00:05Z",
    "messageId": "smtp-message-id"
  }
}
```

### EmailFailed

**Routing Key**: `email.failed`  
**Triggers**: Retry or dead-letter after max retries

```json
{
  "eventId": "uuid",
  "eventType": "email.failed",
  "eventVersion": "1.0",
  "aggregateId": "order-uuid",
  "aggregateType": "Order",
  "occurredAt": "2025-11-18T10:00:05Z",
  "causationId": "email-notification-requested-event-uuid",
  "payload": {
    "recipient": "buyer@example.com",
    "templateType": "order_confirmation",
    "orderNumber": "ORD-2025-11-000123",
    "error": "SMTP connection timeout",
    "retryAttempt": 1,
    "maxRetries": 3,
    "willRetry": true,
    "nextRetryAt": "2025-11-18T10:05:05Z"
  }
}
```

---

## Event Versioning

### Version Strategy

- Events use semantic versioning: `major.minor`
- Major version change = breaking change
- Minor version change = backward-compatible addition
- Consumers must handle multiple versions

### Example: Handling Version Changes

```typescript
// Handler supports v1.0 and v2.0
function handleOrderPlaced(event: BaseEvent) {
  if (event.eventVersion === '1.0') {
    // Handle v1.0 schema
    const payload = event.payload as OrderPlacedV1;
    // ...
  } else if (event.eventVersion === '2.0') {
    // Handle v2.0 schema with new fields
    const payload = event.payload as OrderPlacedV2;
    // ...
  } else {
    throw new UnsupportedVersionError(event.eventVersion);
  }
}
```

---

## Retry & Dead-Letter Policy

### Retry Strategy

- **Max Retries**: 5 attempts
- **Backoff**: Exponential (1s, 2s, 4s, 8s, 16s)
- **Timeout per attempt**: 30 seconds
- **After max retries**: Move to dead-letter queue

### Dead-Letter Queue

- **Queue**: `dead-letter`
- **Retention**: 7 days
- **Manual intervention required**
- **Monitoring**: Alert on any DLQ messages

---

## Event Retention

- **Processed events**: 7 days
- **Unprocessed events**: No limit (until processed or moved to DLQ)
- **Dead-letter events**: 7 days (then archived)

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-18

