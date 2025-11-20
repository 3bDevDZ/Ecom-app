# Data Model: B2B E-Commerce Platform MVP

**Feature**: B2B E-Commerce Platform MVP  
**Date**: 2025-11-18  
**Status**: Phase 1 Complete  

## Overview

This document defines the domain model for the B2B E-Commerce Platform MVP following Domain-Driven Design (DDD) principles. The model is organized by bounded contexts with clear aggregate boundaries, entities, value objects, and domain events.

---

## Bounded Context: Landing CMS

### Aggregates

#### LandingPageContent (Aggregate Root)

**Purpose**: Manages all editable sections of the landing page

**State**:
```typescript
{
  id: string (UUID)
  version: number
  isDraft: boolean
  isPublished: boolean
  hero: HeroSection
  trustLogos: TrustLogos
  productShowcase: ProductShowcase
  showroomInfo: ShowroomInfo
  contactSection: ContactSection
  footer: FooterContent
  lastModifiedBy: string (userId)
  lastModifiedAt: Date
  publishedAt: Date | null
  createdAt: Date
}
```

**Invariants**:
- Hero heading cannot be empty when publishing
- At least one trust logo must be present when published
- Product showcase must have at least one category

**Operations**:
- `updateHero(section: HeroSection): Result`
- `updateTrustLogos(logos: TrustLogos): Result`
- `updateProductShowcase(showcase: ProductShowcase): Result`
- `updateShowroomInfo(info: ShowroomInfo): Result`
- `updateContactSection(section: ContactSection): Result`
- `updateFooter(footer: FooterContent): Result`
- `publish(): Result`
- `saveDraft(): Result`

**Domain Events**:
- `ContentUpdated(aggregateId, section, timestamp)`
- `ContentPublished(aggregateId, timestamp)`

### Value Objects

#### HeroSection
```typescript
{
  heading: string (required, max 100 chars)
  subheading: string (required, max 200 chars)
  backgroundImageUrl: string (valid URL)
  primaryCta: { text: string, url: string }
  secondaryCta: { text: string, url: string } | null
}
```

#### TrustLogos
```typescript
{
  logos: Array<{
    name: string
    imageUrl: string (valid URL)
    displayOrder: number
  }>
}
```

#### ProductShowcase
```typescript
{
  categories: Array<{
    name: string
    imageUrl: string (valid URL)
    displayOrder: number
  }>
}
```

#### ShowroomInfo
```typescript
{
  address: string (multiline)
  businessHours: string
  mapImageUrl: string (valid URL) | null
  mapEmbedCode: string | null
}
```

#### ContactSection
```typescript
{
  heading: string (required)
  description: string (required)
}
```

#### FooterContent
```typescript
{
  companyDescription: string
  navigationLinks: Array<{ label: string, url: string }>
  copyrightText: string
}
```

---

## Bounded Context: Product Catalog

### Aggregates

#### Product (Aggregate Root)

**Purpose**: Represents a product available for purchase with pricing and inventory

**State**:
```typescript
{
  id: string (UUID)
  sku: SKU (value object)
  name: string (required, max 200 chars)
  description: string (rich text, max 2000 chars)
  category: CategoryId
  brand: string
  images: ProductImage[] (at least 1 required)
  variants: ProductVariant[] (entities)
  basePrice: Money (value object)
  minOrderQuantity: number (default: 1, min: 1)
  maxOrderQuantity: number | null
  isActive: boolean
  tags: string[]
  createdAt: Date
  updatedAt: Date
}
```

**Invariants**:
- SKU must be unique across all products and variants
- At least one image required
- Base price must be positive
- Min order quantity ≥ 1
- If max order quantity set, must be ≥ min order quantity
- Variants must have distinct attribute combinations

**Operations**:
- `create(data): Product`
- `updateDetails(name, description, category, brand): Result`
- `addVariant(variant: ProductVariant): Result`
- `removeVariant(variantId): Result`
- `updatePricing(basePrice): Result`
- `setOrderQuantities(min, max): Result`
- `activate(): Result`
- `deactivate(): Result`
- `checkAvailability(quantity, variantId?): boolean`

**Domain Events**:
- `ProductCreated(productId, sku, timestamp)`
- `ProductUpdated(productId, changes, timestamp)`
- `ProductActivated(productId, timestamp)`
- `ProductDeactivated(productId, timestamp)`

#### Category (Aggregate Root)

**Purpose**: Organizes products into hierarchical categories

**State**:
```typescript
{
  id: string (UUID)
  name: string (required, unique)
  slug: string (URL-friendly, unique)
  description: string | null
  parentId: string (UUID) | null
  displayOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

**Invariants**:
- Name must be unique within same parent
- Cannot be parent of itself (no circular references)
- Cannot deactivate if has active products

### Entities (within Product aggregate)

#### ProductVariant

**Purpose**: Represents a specific variation of a product (size, color, etc.)

**State**:
```typescript
{
  id: string (UUID)
  sku: SKU (value object, unique)
  attributes: Map<string, string> // e.g., { size: "L", color: "Blue" }
  priceDelta: Money | null // difference from base price
  inventory: InventoryInfo (value object)
  isActive: boolean
}
```

**Invariants**:
- Variant SKU must be unique across system
- Attributes combination must be unique within product
- Price delta can be positive (premium) or negative (discount)

### Value Objects

#### SKU
```typescript
{
  value: string (format: XXX-YYYY-ZZZ or custom pattern)
}
```

**Validation**: Alphanumeric with hyphens, 3-50 chars

#### Money
```typescript
{
  amount: number (decimal, 2 places)
  currency: string (ISO 4217, default: "USD")
}
```

**Operations**:
- `add(other: Money): Money`
- `subtract(other: Money): Money`
- `multiply(factor: number): Money`
- `equals(other: Money): boolean`

#### InventoryInfo
```typescript
{
  availableQuantity: number (≥ 0)
  reservedQuantity: number (≥ 0)
  totalQuantity: number (computed: available + reserved)
  lastRestockedAt: Date | null
}
```

**Operations**:
- `reserve(quantity): Result`
- `release(quantity): Result`
- `restock(quantity): Result`
- `isAvailable(requestedQty): boolean`

#### ProductImage
```typescript
{
  url: string (valid URL)
  altText: string
  displayOrder: number
  isPrimary: boolean
}
```

---

## Bounded Context: Order Management

### Aggregates

#### Cart (Aggregate Root)

**Purpose**: Temporary shopping cart for authenticated users

**State**:
```typescript
{
  id: string (UUID)
  userId: string (from Keycloak)
  items: CartItem[] (entities)
  status: CartStatus (value object: "active" | "abandoned" | "converted")
  createdAt: Date
  updatedAt: Date
  expiresAt: Date (7 days from creation)
}
```

**Invariants**:
- User can only have one active cart
- Cannot add items to non-active cart
- Cannot add out-of-stock items
- Min order quantity must be respected per item
- Total cart value must be > 0 to convert to order

**Operations**:
- `addItem(productId, variantId?, quantity): Result`
- `updateItemQuantity(itemId, quantity): Result`
- `removeItem(itemId): Result`
- `clear(): Result`
- `validateInventory(): ValidationResult`
- `calculateSubtotal(): Money`
- `convertToOrder(checkoutData): Order`

**Domain Events**:
- `ItemAddedToCart(cartId, productId, variantId, quantity, timestamp)`
- `ItemRemovedFromCart(cartId, itemId, timestamp)`
- `ItemQuantityUpdated(cartId, itemId, oldQty, newQty, timestamp)`
- `CartCleared(cartId, timestamp)`
- `CartConverted(cartId, orderId, timestamp)`

#### Order (Aggregate Root)

**Purpose**: Represents a placed order with items, shipping, and status tracking

**State**:
```typescript
{
  id: string (UUID)
  orderNumber: OrderNumber (value object)
  userId: string (from Keycloak)
  items: OrderItem[] (entities)
  status: OrderStatus (value object)
  shippingAddress: Address (value object)
  poNumber: string | null
  notes: string | null
  subtotal: Money
  tax: Money
  shipping: Money
  discount: Money | null
  total: Money
  placedAt: Date
  updatedAt: Date
  cancelledAt: Date | null
  expectedDeliveryDate: Date | null
  trackingNumber: string | null
  trackingCarrier: string | null
}
```

**Invariants**:
- Order number must be unique
- Cannot modify order after shipped
- Can only cancel if status is "pending"
- Total = subtotal + tax + shipping - discount
- Must have at least one order item
- All items must have been in stock at order time

**Operations**:
- `create(userId, items, shippingAddress, poNumber?, notes?): Order`
- `cancel(): Result`
- `updateStatus(newStatus): Result` // For external system integration
- `addTrackingInfo(carrier, trackingNumber): Result`
- `calculateTotal(): Money`

**Domain Events**:
- `OrderPlaced(orderId, orderNumber, userId, total, timestamp)`
- `OrderCancelled(orderId, orderNumber, reason, timestamp)`
- `OrderStatusChanged(orderId, oldStatus, newStatus, timestamp)`
- `InventoryReservationRequested(orderId, items, timestamp)`
- `InventoryReleased(orderId, items, timestamp)`

### Entities (within aggregates)

#### CartItem (within Cart)

**Purpose**: Line item in shopping cart

**State**:
```typescript
{
  id: string (UUID)
  productId: string (UUID)
  variantId: string (UUID) | null
  productSnapshot: {
    sku: string
    name: string
    imageUrl: string
  }
  quantity: number (≥ min order quantity)
  priceSnapshot: Money
  addedAt: Date
}
```

**Invariants**:
- Quantity must meet product's min order quantity
- Price snapshot captures price at time of add

#### OrderItem (within Order)

**Purpose**: Line item in completed order

**State**:
```typescript
{
  id: string (UUID)
  productId: string (UUID)
  variantId: string (UUID) | null
  sku: string
  productName: string
  variantAttributes: Map<string, string> | null
  quantity: number
  unitPrice: Money
  subtotal: Money (quantity × unitPrice)
  imageUrl: string
}
```

**Invariants**:
- Immutable after order placement
- Subtotal = quantity × unitPrice

### Value Objects

#### OrderNumber
```typescript
{
  value: string (format: ORD-YYYY-MM-XXXXXX)
}
```

**Generation**: `ORD-` + year + month + 6-digit sequential

#### OrderStatus
```typescript
enum {
  PENDING = "pending"           // Initial state after placement
  PROCESSING = "processing"     // Being prepared (external system)
  SHIPPED = "shipped"           // In transit
  DELIVERED = "delivered"       // Completed
  CANCELLED = "cancelled"       // Cancelled by user or system
}
```

**State Transitions**:
- PENDING → PROCESSING, CANCELLED
- PROCESSING → SHIPPED, CANCELLED
- SHIPPED → DELIVERED
- CANCELLED → (terminal)
- DELIVERED → (terminal)

#### CartStatus
```typescript
enum {
  ACTIVE = "active"          // Current shopping cart
  ABANDONED = "abandoned"    // Expired or user inactive
  CONVERTED = "converted"    // Successfully converted to order
}
```

#### Address
```typescript
{
  street: string (required)
  city: string (required)
  state: string (required, 2-letter code)
  postalCode: string (required, format validation)
  country: string (required, ISO 3166-1 alpha-2)
  contactName: string (required)
  contactPhone: string (required, format validation)
}
```

**Validation**:
- All fields required
- Postal code format varies by country
- Phone number format validation

---

## Bounded Context: Identity

### Aggregates

#### UserProfile (Aggregate Root)

**Purpose**: Local cache of user information from Keycloak

**State**:
```typescript
{
  id: string (UUID, matches Keycloak sub)
  email: string (unique, from Keycloak)
  firstName: string
  lastName: string
  keycloakId: string (sub claim)
  roles: string[] (from Keycloak realm_access)
  lastLoginAt: Date
  createdAt: Date
  updatedAt: Date
}
```

**Invariants**:
- Email must be unique
- Keycloak ID must be unique
- Roles synced from Keycloak on login

**Operations**:
- `createFromKeycloakToken(token): UserProfile`
- `updateFromKeycloakToken(token): Result`
- `recordLogin(): Result`

**Domain Events**:
- `UserProfileCreated(userId, email, timestamp)`
- `UserProfileUpdated(userId, changes, timestamp)`
- `UserLoggedIn(userId, timestamp)`

---

## Shared Kernel

### Base Types

#### BaseEntity
```typescript
{
  id: string (UUID)
  createdAt: Date
  updatedAt: Date
}
```

#### BaseAggregateRoot extends BaseEntity
```typescript
{
  version: number (for optimistic locking)
  uncommittedEvents: DomainEvent[]
}
```

**Operations**:
- `addDomainEvent(event): void`
- `clearDomainEvents(): DomainEvent[]`
- `incrementVersion(): void`

#### DomainEvent
```typescript
{
  eventId: string (UUID)
  eventType: string
  aggregateId: string
  occurredAt: Date
  payload: any
}
```

---

## Infrastructure Entities (Persistence Layer)

### OutboxEvent

**Purpose**: Transactional outbox pattern for reliable event publishing

**State**:
```typescript
{
  id: string (UUID)
  eventType: string
  aggregateId: string
  payload: JSONB
  processed: boolean
  processedAt: Date | null
  retryCount: number
  maxRetries: number (default: 5)
  error: string | null
  createdAt: Date
}
```

**Indexes**:
- `(processed, createdAt)` for polling unprocessed events
- `eventType` for filtering

**TTL**: 7 days after processing

---

## Read Models (CQRS Query Side)

### ProductReadModel

**Purpose**: Optimized for product search and listing queries

**State**:
```typescript
{
  id: string (UUID)
  sku: string
  name: string
  description: string (searchable)
  categoryId: string
  categoryName: string
  brand: string
  basePrice: decimal
  primaryImageUrl: string
  isActive: boolean
  hasVariants: boolean
  minOrderQuantity: number
  availableQuantity: number (denormalized from inventory)
  tags: string[] (searchable array)
  searchVector: tsvector (PostgreSQL full-text search)
  updatedAt: Date
}
```

**Indexes**:
- Full-text search on `searchVector`
- `(categoryId, isActive, availableQuantity > 0)`
- `brand`
- `basePrice`

### OrderHistoryReadModel

**Purpose**: Optimized for user order history queries

**State**:
```typescript
{
  id: string (UUID)
  orderNumber: string
  userId: string
  status: string
  total: decimal
  itemCount: number
  placedAt: Date
  updatedAt: Date
  shippingAddress: JSONB
  items: JSONB (denormalized)
}
```

**Indexes**:
- `(userId, placedAt DESC)`
- `(userId, status)`
- `orderNumber` (unique)

---

## Data Consistency & Integrity

### Transaction Boundaries

- **Cart operations**: Single transaction per cart modification
- **Order placement**: Transaction spans order creation, inventory reservation, and outbox event
- **Inventory operations**: Atomic reserve/release with row-level locking
- **CMS updates**: Transaction per content section update

### Eventual Consistency

- Read models updated via domain events
- Acceptable lag: < 1 second for most operations
- Email notifications: Best-effort (3 retries)
- RabbitMQ events: 5 retries before dead-letter

### Concurrency Control

- **Optimistic locking**: Version field on aggregates
- **Pessimistic locking**: Inventory operations (SELECT FOR UPDATE)
- **Idempotency**: Event handlers check for duplicate processing

---

## Validation Rules Summary

### Product Catalog
- SKU: Unique, 3-50 chars, alphanumeric + hyphens
- Price: > 0, max 2 decimal places
- Min order quantity: ≥ 1
- Max order quantity: ≥ min or null
- Images: At least 1 required
- Catalog size: 10,000-50,000 products (performance target)

### Cart & Orders
- Cart expiry: 7 days
- Inventory reservation: 30 minutes timeout
- Order number: ORD-YYYY-MM-XXXXXX format
- Address: All fields required, format validation
- Min cart value: > 0

### CMS
- Hero heading: Required, max 100 chars
- URLs: Valid URL format
- Images: Valid URL or uploaded file

### Inventory
- Available quantity: ≥ 0
- Reserved quantity: ≥ 0
- Reservation timeout: 30 minutes
- Stock check: Real-time before checkout

---

## Migration Strategy

### Phase 1 (MVP)
1. Create all core tables (users, products, variants, categories, orders, carts, inventory, landing_cms, outbox)
2. Seed initial categories and sample products
3. Configure indexes for search performance
4. Set up foreign key constraints

### Phase 2 (Future)
- Add store tables
- Add customer management tables
- Add CDC configuration tables
- Add import job tracking

### Rollback Strategy
- All migrations reversible
- Data backup before each migration
- Foreign key constraints allow cascading deletes where appropriate

---

## Appendix: Entity Relationship Diagram

```
┌─────────────────┐
│  LandingPageContent │
└─────────────────┘

┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│  Category   │──────<│   Product    │>──────│ Inventory   │
└─────────────┘       └──────────────┘       └─────────────┘
                            │
                            │ 1:N
                            ▼
                      ┌──────────────┐
                      │ProductVariant│
                      └──────────────┘

┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│ UserProfile │──────<│     Cart     │>──────│  CartItem   │
└─────────────┘       └──────────────┘       └─────────────┘
       │
       │ 1:N
       ▼
┌──────────────┐       ┌─────────────┐
│    Order     │>──────│  OrderItem  │
└──────────────┘       └─────────────┘

┌──────────────┐
│ OutboxEvent  │ (infrastructure)
└──────────────┘

┌──────────────────┐
│ProductReadModel  │ (CQRS read side)
└──────────────────┘

┌──────────────────┐
│OrderHistoryReadModel│ (CQRS read side)
└──────────────────┘
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-18  
**Status**: Ready for Implementation

