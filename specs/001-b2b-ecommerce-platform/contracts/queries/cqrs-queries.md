# CQRS Query Contracts

**Feature**: B2B E-Commerce Platform MVP  
**Date**: 2025-11-18  
**Pattern**: Command Query Responsibility Segregation (CQRS)

## Overview

This document defines all query contracts for the B2B E-Commerce Platform. Queries are read-only operations that return data without modifying state. They operate on optimized read models that are eventually consistent with the write side.

---

## Query Structure

All queries follow this pattern:

```typescript
class QueryName implements IQuery {
  constructor(
    public readonly param1: Type1,
    public readonly param2?: Type2,
    // ... parameters
  ) {}
}

@QueryHandler(QueryName)
class QueryNameHandler implements IQueryHandler<QueryName> {
  constructor(
    private readonly readRepository: ReadRepository
  ) {}
  
  async execute(query: QueryName): Promise<ResultType> {
    // Query read model
  }
}
```

---

## Landing CMS Queries

### GetLandingContentQuery

**Purpose**: Retrieve landing page content (published or draft)

```typescript
class GetLandingContentQuery {
  constructor(
    public readonly isDraft: boolean = false
  ) {}
}

// Result
interface LandingContentDto {
  id: string;
  version: number;
  isDraft: boolean;
  hero: HeroSectionDto;
  trustLogos: TrustLogoDto[];
  productShowcase: ProductShowcaseCategoryDto[];
  showroomInfo: ShowroomInfoDto;
  contactSection: ContactSectionDto;
  footer: FooterContentDto;
  publishedAt: Date | null;
  lastModifiedAt: Date;
}
```

---

## Product Catalog Queries

### SearchProductsQuery

**Purpose**: Full-text search across products with filters

```typescript
class SearchProductsQuery {
  constructor(
    public readonly keyword: string,
    public readonly filters?: ProductFilters,
    public readonly pagination?: PaginationParams
  ) {}
}

interface ProductFilters {
  categoryIds?: string[];
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  availability?: 'in_stock' | 'out_of_stock' | 'all';
  tags?: string[];
}

interface PaginationParams {
  page: number;          // 1-based
  limit: number;         // max 100
}

// Result
interface ProductSearchResult {
  data: ProductSummaryDto[];
  pagination: PaginationMetaDto;
  facets?: {
    categories: { id: string; name: string; count: number }[];
    brands: { name: string; count: number }[];
    priceRanges: { min: number; max: number; count: number }[];
  };
}
```

### GetProductsQuery

**Purpose**: List products with filtering and pagination

```typescript
class GetProductsQuery {
  constructor(
    public readonly filters?: ProductFilters,
    public readonly sortBy?: ProductSortOption,
    public readonly pagination?: PaginationParams
  ) {}
}

enum ProductSortOption {
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
  POPULARITY = 'popularity'
}

// Result: ProductSearchResult (same as SearchProducts)
```

### GetProductByIdQuery

**Purpose**: Get detailed product information

```typescript
class GetProductByIdQuery {
  constructor(
    public readonly productId: string
  ) {}
}

// Result
interface ProductDetailDto {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: CategoryDto;
  brand: string;
  images: ProductImageDto[];
  basePrice: MoneyDto;
  variants: ProductVariantDto[];
  minOrderQuantity: number;
  maxOrderQuantity: number | null;
  isActive: boolean;
  tags: string[];
  inventory: {
    totalAvailable: number;
    totalReserved: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### GetProductBySkuQuery

**Purpose**: Look up product by SKU

```typescript
class GetProductBySkuQuery {
  constructor(
    public readonly sku: string
  ) {}
}

// Result: ProductDetailDto
```

### CheckProductAvailabilityQuery

**Purpose**: Check real-time inventory availability

```typescript
class CheckProductAvailabilityQuery {
  constructor(
    public readonly productId: string,
    public readonly variantId?: string,
    public readonly requestedQuantity?: number
  ) {}
}

// Result
interface ProductAvailabilityDto {
  productId: string;
  variantId?: string;
  sku: string;
  availableQuantity: number;
  reservedQuantity: number;
  isAvailable: boolean;
  requestedQuantity?: number;
  canFulfill: boolean;
  message?: string; // e.g., "Only 5 available"
}
```

### GetCategoriesQuery

**Purpose**: Get hierarchical category tree

```typescript
class GetCategoriesQuery {
  constructor(
    public readonly parentId?: string | null,  // null = root categories
    public readonly includeInactive?: boolean
  ) {}
}

// Result
interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  children?: CategoryDto[];
  displayOrder: number;
  isActive: boolean;
  productCount: number;
}
```

### GetCategoryByIdQuery

**Purpose**: Get category with products

```typescript
class GetCategoryByIdQuery {
  constructor(
    public readonly categoryId: string,
    public readonly includeProducts?: boolean
  ) {}
}

// Result
interface CategoryDetailDto extends CategoryDto {
  products?: ProductSummaryDto[];
  breadcrumb: { id: string; name: string }[];
}
```

---

## Cart Queries

### GetCartQuery

**Purpose**: Get authenticated user's active cart

```typescript
class GetCartQuery {
  constructor(
    public readonly userId: string
  ) {}
}

// Result
interface CartDto {
  id: string;
  userId: string;
  items: CartItemDto[];
  subtotal: MoneyDto;
  itemCount: number;
  status: 'active' | 'abandoned' | 'converted';
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  validationWarnings?: ValidationWarning[];
}

interface CartItemDto {
  id: string;
  product: {
    id: string;
    sku: string;
    name: string;
    imageUrl: string;
  };
  variant?: {
    id: string;
    sku: string;
    attributes: Record<string, string>;
  };
  quantity: number;
  unitPrice: MoneyDto;
  subtotal: MoneyDto;
  addedAt: Date;
  inventoryStatus: 'available' | 'low_stock' | 'out_of_stock';
  moqMet: boolean;
}

interface ValidationWarning {
  itemId: string;
  type: 'price_changed' | 'inventory_low' | 'inventory_unavailable' | 'product_inactive' | 'moq_not_met';
  message: string;
  severity: 'info' | 'warning' | 'error';
}
```

### ValidateCartQuery

**Purpose**: Validate cart contents before checkout

```typescript
class ValidateCartQuery {
  constructor(
    public readonly cartId: string
  ) {}
}

// Result
interface CartValidationResult {
  isValid: boolean;
  errors: ValidationWarning[];
  canProceedToCheckout: boolean;
  totalAdjustment?: MoneyDto; // if prices changed
}
```

---

## Order Queries

### GetOrderHistoryQuery

**Purpose**: List user's orders with filtering

```typescript
class GetOrderHistoryQuery {
  constructor(
    public readonly userId: string,
    public readonly filters?: OrderFilters,
    public readonly pagination?: PaginationParams
  ) {}
}

interface OrderFilters {
  status?: OrderStatus[];
  fromDate?: Date;
  toDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string; // order number, PO number
}

enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

// Result
interface OrderHistoryResult {
  data: OrderSummaryDto[];
  pagination: PaginationMetaDto;
  totals?: {
    totalOrders: number;
    totalSpent: MoneyDto;
    averageOrderValue: MoneyDto;
  };
}

interface OrderSummaryDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: MoneyDto;
  itemCount: number;
  placedAt: Date;
  updatedAt: Date;
  shippingAddress: AddressDto;
  trackingNumber?: string;
  expectedDeliveryDate?: Date;
}
```

### GetOrderByIdQuery

**Purpose**: Get detailed order information

```typescript
class GetOrderByIdQuery {
  constructor(
    public readonly orderId: string,
    public readonly userId?: string  // for authorization check
  ) {}
}

// Result
interface OrderDetailDto {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  statusHistory: OrderStatusHistoryDto[];
  items: OrderItemDto[];
  shippingAddress: AddressDto;
  poNumber?: string;
  notes?: string;
  subtotal: MoneyDto;
  tax: MoneyDto;
  shipping: MoneyDto;
  discount?: MoneyDto;
  total: MoneyDto;
  placedAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  trackingNumber?: string;
  trackingCarrier?: string;
  trackingUrl?: string;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
}

interface OrderStatusHistoryDto {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
}

interface OrderItemDto {
  id: string;
  productId: string;
  variantId?: string;
  sku: string;
  productName: string;
  variantAttributes?: Record<string, string>;
  quantity: number;
  unitPrice: MoneyDto;
  subtotal: MoneyDto;
  imageUrl: string;
}
```

### GetOrderByNumberQuery

**Purpose**: Look up order by order number

```typescript
class GetOrderByNumberQuery {
  constructor(
    public readonly orderNumber: string,
    public readonly userId?: string  // for authorization check
  ) {}
}

// Result: OrderDetailDto
```

---

## User Profile Queries

### GetUserProfileQuery

**Purpose**: Get user profile from local cache

```typescript
class GetUserProfileQuery {
  constructor(
    public readonly userId: string
  ) {}
}

// Result
interface UserProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  lastLoginAt: Date;
  createdAt: Date;
}
```

---

## Read Model Synchronization

### Read Model Strategy

All queries operate on read models that are updated via event handlers:

```typescript
@EventsHandler(OrderPlacedEvent)
class OrderHistoryReadModelSyncHandler implements IEventHandler<OrderPlacedEvent> {
  constructor(
    private readonly orderHistoryRepository: OrderHistoryReadModelRepository
  ) {}

  async handle(event: OrderPlacedEvent) {
    // Update read model from event
    await this.orderHistoryRepository.create({
      id: event.aggregateId,
      orderNumber: event.payload.orderNumber,
      userId: event.payload.userId,
      status: 'pending',
      total: event.payload.total,
      itemCount: event.payload.items.length,
      placedAt: event.occurredAt,
      // ... other fields
    });
  }
}
```

### Eventual Consistency

- **Lag**: < 1 second for most operations
- **Monitoring**: Track read model sync lag
- **Fallback**: Query write model if read model unavailable

---

## Common DTOs

### MoneyDto

```typescript
interface MoneyDto {
  amount: number;    // decimal with 2 places
  currency: string;  // ISO 4217 (e.g., "USD")
}
```

### AddressDto

```typescript
interface AddressDto {
  street: string;
  city: string;
  state: string;      // 2-letter code
  postalCode: string;
  country: string;    // ISO 3166-1 alpha-2
  contactName: string;
  contactPhone: string;
}
```

### PaginationMetaDto

```typescript
interface PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

### ProductSummaryDto

```typescript
interface ProductSummaryDto {
  id: string;
  sku: string;
  name: string;
  description: string;  // truncated to 200 chars
  basePrice: MoneyDto;
  primaryImage: string; // URL
  isActive: boolean;
  hasVariants: boolean;
  availability: 'in_stock' | 'out_of_stock' | 'low_stock';
  minOrderQuantity: number;
}
```

---

## Performance Considerations

### Indexing Strategy

**ProductReadModel**:
- Full-text search on `searchVector` (PostgreSQL tsvector)
- Index on `(categoryId, isActive, availableQuantity > 0)`
- Index on `brand`
- Index on `basePrice`

**OrderHistoryReadModel**:
- Index on `(userId, placedAt DESC)`
- Index on `(userId, status)`
- Unique index on `orderNumber`

**CartReadModel**:
- Unique index on `(userId, status)` where status = 'active'
- Index on `expiresAt` for cleanup jobs

### Caching Strategy

- **Product list/search**: Cache for 5 minutes
- **Product detail**: Cache for 15 minutes, invalidate on update
- **Category tree**: Cache for 1 hour
- **Cart**: No caching (real-time)
- **Order detail**: Cache for 5 minutes

### Query Optimization

- Use projection to return only needed fields
- Implement cursor-based pagination for large datasets
- Limit search results to max 100 per page
- Use database query plan analysis for slow queries

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-18  
**Status**: Ready for Implementation

