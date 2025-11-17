# B2B E-Commerce Platform - Features & Technical Specification

## Executive Summary

This document outlines the comprehensive functional specifications and domain models for a B2B e-commerce platform built using modern architectural patterns and technologies. The platform will be developed using **NestJS** with its templating engine (Handlebars/EJS), **Tailwind CSS** for styling, and implementing **Clean Architecture**, **CQRS** (Command Query Responsibility Segregation), and **DDD** (Domain-Driven Design) principles.

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Core Domain Models](#core-domain-models)
3. [Feature Specifications](#feature-specifications)
4. [Technical Implementation Guidelines](#technical-implementation-guidelines)
5. [Module Structure](#module-structure)
6. [API Specifications](#api-specifications)

---

## 1. System Architecture Overview

### 1.1 Technology Stack

- **Backend Framework**: NestJS (Node.js)
- **Template Engine**: Handlebars/EJS for SSR
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with TypeORM
- **Caching**: Redis
- **Message Queue**: RabbitMQ/Bull for async operations
- **Authentication**: JWT with Passport.js
- **Validation**: class-validator & class-transformer

### 1.2 Architectural Patterns

#### Clean Architecture Layers

```
┌─────────────────────────────────────────────┐
│           Presentation Layer                 │
│  (Controllers, Views, DTOs, Presenters)      │
├─────────────────────────────────────────────┤
│           Application Layer                  │
│  (Use Cases, Commands, Queries, Handlers)   │
├─────────────────────────────────────────────┤
│            Domain Layer                      │
│  (Entities, Value Objects, Domain Services)  │
├─────────────────────────────────────────────┤
│         Infrastructure Layer                 │
│  (Repositories, External Services, DB)       │
└─────────────────────────────────────────────┘
```

#### CQRS Implementation

- **Commands**: Write operations (CreateOrder, UpdateInventory, ProcessPayment)
- **Queries**: Read operations (GetProductList, GetOrderDetails, GetUserProfile)
- **Event Sourcing**: Audit trail for critical business operations
- **Read/Write Model Separation**: Optimized data models for different operations

#### DDD Principles

- **Bounded Contexts**: User Management, Product Catalog, Order Management, Inventory, Payment
- **Aggregates**: Order, Product, User, Cart, Invoice
- **Domain Events**: OrderPlaced, PaymentProcessed, InventoryUpdated
- **Value Objects**: Money, Address, ProductSKU, OrderNumber

---

## 2. Core Domain Models

### 2.1 User & Authentication Domain

```typescript
// Value Objects
class EmailAddress {
  private readonly value: string;
  constructor(email: string) {
    // Validation logic
  }
}

class CompanyIdentification {
  readonly taxId: string;
  readonly companyRegistrationNumber: string;
  readonly dunsNumber?: string;
}

// Entities
class User {
  readonly id: UserId;
  readonly email: EmailAddress;
  readonly role: UserRole;
  readonly company: Company;
  readonly profile: UserProfile;
  readonly permissions: Permission[];
  readonly createdAt: Date;
  readonly lastLoginAt: Date;
  readonly isActive: boolean;
  readonly creditLimit?: Money;
  readonly paymentTerms?: PaymentTerms;
}

class Company {
  readonly id: CompanyId;
  readonly name: string;
  readonly identification: CompanyIdentification;
  readonly type: CompanyType; // Wholesaler, Retailer, Manufacturer
  readonly addresses: Address[];
  readonly contacts: Contact[];
  readonly creditRating: CreditRating;
  readonly contractedPricing?: PricingTier;
}

// Enums
enum UserRole {
  SUPER_ADMIN = 'super_admin',
  COMPANY_ADMIN = 'company_admin',
  BUYER = 'buyer',
  SALES_REP = 'sales_rep',
  WAREHOUSE_MANAGER = 'warehouse_manager',
  ACCOUNTANT = 'accountant'
}
```

### 2.2 Product Catalog Domain

```typescript
// Value Objects
class SKU {
  readonly value: string;
  constructor(sku: string) {
    // Format validation: XXX-YYYY-ZZZ
  }
}

class Barcode {
  readonly type: BarcodeType; // EAN13, UPC, CODE128
  readonly value: string;
}

class Dimensions {
  readonly length: number;
  readonly width: number;
  readonly height: number;
  readonly unit: MeasurementUnit;
  
  getVolume(): number;
  getVolumetricWeight(): number;
}

// Entities
class Product {
  readonly id: ProductId;
  readonly sku: SKU;
  readonly name: string;
  readonly description: string;
  readonly category: Category;
  readonly brand: Brand;
  readonly images: ProductImage[];
  readonly specifications: Specification[];
  readonly variants: ProductVariant[];
  readonly pricing: PricingStrategy;
  readonly inventory: InventoryInfo;
  readonly minOrderQuantity: number;
  readonly maxOrderQuantity?: number;
  readonly packagingUnit: PackagingUnit;
  readonly dimensions: Dimensions;
  readonly weight: Weight;
  readonly isActive: boolean;
  readonly tags: Tag[];
  
  getPriceForQuantity(quantity: number, tier: PricingTier): Money;
  checkAvailability(quantity: number): boolean;
}

class ProductVariant {
  readonly id: VariantId;
  readonly parentProduct: ProductId;
  readonly sku: SKU;
  readonly attributes: Map<string, string>; // color, size, etc.
  readonly priceDelta?: Money;
  readonly inventory: InventoryInfo;
}

class PricingStrategy {
  readonly basePrice: Money;
  readonly tiers: TierPricing[];
  readonly bulkDiscounts: BulkDiscount[];
  readonly contractPricing: Map<CompanyId, Money>;
  
  calculatePrice(quantity: number, company?: CompanyId): Money;
}
```

### 2.3 Order Management Domain

```typescript
// Value Objects
class OrderNumber {
  readonly value: string;
  
  static generate(): OrderNumber {
    // Format: ORD-YYYY-MM-XXXXXX
  }
}

class ShippingMethod {
  readonly carrier: string;
  readonly service: string;
  readonly estimatedDays: number;
  readonly cost: Money;
}

// Aggregates
class Order {
  readonly id: OrderId;
  readonly orderNumber: OrderNumber;
  readonly customer: Customer;
  readonly items: OrderItem[];
  readonly status: OrderStatus;
  readonly shippingAddress: Address;
  readonly billingAddress: Address;
  readonly shippingMethod: ShippingMethod;
  readonly paymentMethod: PaymentMethod;
  readonly subtotal: Money;
  readonly tax: Money;
  readonly shipping: Money;
  readonly discount?: Money;
  readonly total: Money;
  readonly notes?: string;
  readonly poNumber?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly expectedDelivery?: Date;
  readonly actualDelivery?: Date;
  
  addItem(product: Product, quantity: number): void;
  removeItem(itemId: OrderItemId): void;
  updateQuantity(itemId: OrderItemId, quantity: number): void;
  applyDiscount(discount: Discount): void;
  calculateTotals(): void;
  changeStatus(newStatus: OrderStatus): void;
  canBeCancelled(): boolean;
  generateInvoice(): Invoice;
}

class OrderItem {
  readonly id: OrderItemId;
  readonly product: Product;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly discount?: Money;
  readonly tax: Money;
  readonly total: Money;
  readonly fulfillmentStatus: FulfillmentStatus;
  readonly serialNumbers?: string[];
  
  calculateTotal(): Money;
}

// Domain Events
class OrderPlacedEvent {
  readonly orderId: OrderId;
  readonly customerId: CustomerId;
  readonly total: Money;
  readonly timestamp: Date;
}

class OrderShippedEvent {
  readonly orderId: OrderId;
  readonly trackingNumber: string;
  readonly carrier: string;
  readonly timestamp: Date;
}
```

### 2.4 Cart & Checkout Domain

```typescript
class Cart {
  readonly id: CartId;
  readonly userId: UserId;
  readonly items: CartItem[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly expiresAt: Date;
  
  addProduct(product: Product, quantity: number): void;
  updateQuantity(itemId: CartItemId, quantity: number): void;
  removeItem(itemId: CartItemId): void;
  clear(): void;
  calculateSubtotal(): Money;
  validateInventory(): ValidationResult;
  convertToOrder(checkoutData: CheckoutData): Order;
}

class CartItem {
  readonly id: CartItemId;
  readonly product: Product;
  readonly quantity: number;
  readonly addedAt: Date;
  readonly priceSnapshot: Money;
  
  validateMinimumQuantity(): boolean;
  checkStockAvailability(): boolean;
}

class CheckoutData {
  readonly shippingAddress: Address;
  readonly billingAddress: Address;
  readonly shippingMethod: ShippingMethod;
  readonly paymentMethod: PaymentMethod;
  readonly poNumber?: string;
  readonly notes?: string;
}
```

### 2.5 Inventory Domain

```typescript
class InventoryItem {
  readonly productId: ProductId;
  readonly warehouseId: WarehouseId;
  readonly availableQuantity: number;
  readonly reservedQuantity: number;
  readonly incomingQuantity: number;
  readonly reorderPoint: number;
  readonly reorderQuantity: number;
  readonly lastRestockedAt: Date;
  readonly location: WarehouseLocation;
  
  reserve(quantity: number, orderId: OrderId): void;
  release(quantity: number, orderId: OrderId): void;
  updateStock(quantity: number, type: StockMovementType): void;
  needsReorder(): boolean;
}

class StockMovement {
  readonly id: MovementId;
  readonly productId: ProductId;
  readonly type: StockMovementType;
  readonly quantity: number;
  readonly reason: string;
  readonly reference?: string; // Order ID, Return ID, etc.
  readonly performedBy: UserId;
  readonly timestamp: Date;
}

enum StockMovementType {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
  DAMAGED = 'damaged'
}
```

---

## 3. Feature Specifications

### 3.1 Authentication & Authorization Features

#### 3.1.1 Multi-Factor Authentication
- **Email/Password Login**: Standard authentication with password strength requirements
- **SSO Integration**: Google Workspace, Microsoft Azure AD support
- **2FA Options**: SMS, TOTP (Google Authenticator), Email verification
- **Session Management**: JWT tokens with refresh token rotation
- **Remember Device**: Trusted device registration for 30 days

#### 3.1.2 Role-Based Access Control (RBAC)
- **Hierarchical Permissions**: Company > Department > User level permissions
- **Dynamic Role Assignment**: Runtime permission checking
- **Resource-Level Security**: Product, order, and report access control
- **API Rate Limiting**: Role-based API throttling

### 3.2 Product Catalog Features

#### 3.2.1 Advanced Search & Filtering
```typescript
interface ProductSearchCriteria {
  keyword?: string;
  categories?: CategoryId[];
  brands?: BrandId[];
  priceRange?: { min: Money; max: Money };
  availability?: AvailabilityStatus;
  attributes?: Map<string, string[]>;
  tags?: string[];
  sortBy?: SortOption;
  pagination?: PaginationParams;
}
```

- **Full-Text Search**: Elasticsearch integration for product search
- **Faceted Navigation**: Dynamic filter generation based on results
- **Smart Suggestions**: ML-powered product recommendations
- **Barcode/QR Scanning**: Mobile app integration for quick product lookup
- **Bulk Search**: CSV upload for multiple SKU search

#### 3.2.2 Product Information Management
- **Rich Media Support**: Multiple images, 360° views, videos, PDF catalogs
- **Variant Management**: Size, color, material combinations
- **Specification Tables**: Technical details with comparison capability
- **Related Products**: Cross-sell and upsell recommendations
- **Product Bundles**: Grouped product offerings with special pricing

#### 3.2.3 Pricing Features
- **Tiered Pricing**: Volume-based price breaks
- **Contract Pricing**: Customer-specific negotiated rates
- **Dynamic Discounts**: Time-based, quantity-based, bundle discounts
- **Price Lists**: Multiple price lists per customer segment
- **Quote Generation**: Custom quote creation for large orders

### 3.3 Shopping Cart & Checkout

#### 3.3.1 Cart Management
- **Persistent Cart**: Cross-device cart synchronization
- **Quick Order**: Bulk add via SKU list or CSV
- **Save for Later**: Wishlist functionality
- **Cart Sharing**: Share cart with team members for approval
- **Abandoned Cart Recovery**: Email reminders with cart restoration

#### 3.3.2 Checkout Process
```typescript
interface CheckoutFlow {
  steps: [
    'cart_review',
    'shipping_address',
    'shipping_method',
    'payment_method',
    'order_review',
    'confirmation'
  ];
  validations: ValidationRule[];
  paymentOptions: PaymentMethod[];
}
```

- **Multi-Step Checkout**: Progressive disclosure with validation
- **Address Management**: Address book with validation
- **Shipping Calculator**: Real-time shipping cost calculation
- **Tax Calculation**: Automated tax calculation based on jurisdiction
- **Order Notes**: Special instructions and PO number fields

### 3.4 Order Management

#### 3.4.1 Order Processing
- **Order Status Tracking**: Real-time status updates with timeline
- **Partial Fulfillment**: Ship available items separately
- **Backorder Management**: Automatic backorder creation
- **Order Modification**: Edit orders before processing
- **Order Cancellation**: Self-service cancellation with rules

#### 3.4.2 Order History & Reordering
- **Advanced Filtering**: Date range, status, amount filters
- **Quick Reorder**: One-click reorder from history
- **Order Templates**: Save frequent orders as templates
- **Order Comparison**: Compare order details side-by-side
- **Export Capabilities**: PDF invoices, CSV exports

### 3.5 Customer Account Features

#### 3.5.1 Account Dashboard
- **Overview Metrics**: Recent orders, pending shipments, account balance
- **Quick Actions**: Reorder, track shipment, pay invoice
- **Notifications Center**: Order updates, price alerts, announcements
- **Document Center**: Invoices, credit memos, statements

#### 3.5.2 Company Management
- **Multi-User Accounts**: Team member invitation and management
- **Approval Workflows**: Purchase approval chains
- **Budget Controls**: Department/user spending limits
- **Cost Center Assignment**: Allocate purchases to cost centers

### 3.6 B2B Specific Features

#### 3.6.1 Credit Management
```typescript
interface CreditTerms {
  creditLimit: Money;
  paymentTerms: PaymentTerms; // NET30, NET60, etc.
  currentBalance: Money;
  availableCredit: Money;
  overdueAmount?: Money;
  creditStatus: CreditStatus;
}
```

- **Credit Applications**: Online credit application process
- **Credit Limit Monitoring**: Real-time credit availability
- **Payment Terms**: NET 30/60/90 terms configuration
- **Statement Generation**: Monthly account statements
- **Aging Reports**: Outstanding invoice aging

#### 3.6.2 Quote Management
- **Request for Quote (RFQ)**: Formal quote request process
- **Quote Generation**: Professional quote documents
- **Quote Validity**: Expiration and versioning
- **Quote to Order**: Convert approved quotes to orders
- **Negotiation History**: Track quote revisions

### 3.7 Reporting & Analytics

#### 3.7.1 Business Intelligence
- **Sales Analytics**: Revenue, volume, trend analysis
- **Customer Analytics**: Purchase patterns, lifetime value
- **Product Performance**: Best sellers, slow movers
- **Inventory Analytics**: Turnover, stockout analysis

#### 3.7.2 Custom Reports
- **Report Builder**: Drag-and-drop report creation
- **Scheduled Reports**: Automated email delivery
- **Data Export**: Multiple format support (PDF, Excel, CSV)
- **API Access**: Programmatic report generation

---

## 4. Technical Implementation Guidelines

### 4.1 NestJS Module Structure

```typescript
// Core module structure following DDD and Clean Architecture
src/
├── modules/
│   ├── user/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   ├── repositories/
│   │   │   └── services/
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   ├── queries/
│   │   │   ├── dto/
│   │   │   └── use-cases/
│   │   ├── infrastructure/
│   │   │   ├── persistence/
│   │   │   ├── adapters/
│   │   │   └── mappers/
│   │   └── presentation/
│   │       ├── controllers/
│   │       ├── views/
│   │       └── presenters/
│   ├── product/
│   ├── order/
│   ├── cart/
│   └── inventory/
├── shared/
│   ├── domain/
│   ├── infrastructure/
│   └── application/
└── common/
    ├── decorators/
    ├── filters/
    ├── guards/
    ├── interceptors/
    └── pipes/
```

### 4.2 CQRS Implementation Pattern

```typescript
// Command Example
@Injectable()
export class CreateOrderCommand {
  constructor(
    public readonly userId: string,
    public readonly items: CreateOrderItemDto[],
    public readonly shippingAddress: AddressDto,
    public readonly paymentMethod: PaymentMethodDto
  ) {}
}

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly inventoryService: InventoryService,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CreateOrderCommand): Promise<Order> {
    // Business logic implementation
    const order = Order.create(command);
    
    // Validate inventory
    await this.inventoryService.reserveItems(order.items);
    
    // Save order
    const savedOrder = await this.orderRepository.save(order);
    
    // Publish domain events
    this.eventBus.publish(new OrderPlacedEvent(savedOrder));
    
    return savedOrder;
  }
}

// Query Example
@Injectable()
export class GetOrdersQuery {
  constructor(
    public readonly userId: string,
    public readonly filters?: OrderFilterDto,
    public readonly pagination?: PaginationDto
  ) {}
}

@QueryHandler(GetOrdersQuery)
export class GetOrdersHandler implements IQueryHandler<GetOrdersQuery> {
  constructor(
    private readonly readModelRepository: OrderReadModelRepository
  ) {}

  async execute(query: GetOrdersQuery): Promise<PaginatedResult<OrderDto>> {
    return this.readModelRepository.findByUser(
      query.userId,
      query.filters,
      query.pagination
    );
  }
}
```

### 4.3 Template Engine Integration

```typescript
// Controller with server-side rendering
@Controller('products')
export class ProductViewController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly productPresenter: ProductPresenter
  ) {}

  @Get()
  @Render('products/list')
  async listProducts(
    @Query() filters: ProductFilterDto,
    @CurrentUser() user: User
  ): Promise<ProductListViewModel> {
    const query = new GetProductsQuery(filters, user);
    const products = await this.queryBus.execute(query);
    
    return this.productPresenter.presentList(products, user);
  }

  @Get(':id')
  @Render('products/detail')
  async productDetail(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<ProductDetailViewModel> {
    const query = new GetProductDetailQuery(id, user);
    const product = await this.queryBus.execute(query);
    
    return this.productPresenter.presentDetail(product, user);
  }
}
```

### 4.4 Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.hbs',
    './src/**/*.ejs',
    './src/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#137fec',
        secondary: '#6c757d',
        'background-light': '#f6f7f8',
        'background-dark': '#101922',
        'status-green': '#28a745',
        'status-blue': '#17a2b8',
        'status-orange': '#ffc107',
        'status-red': '#dc3545',
      },
      fontFamily: {
        'display': ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

---

## 5. Module Structure

### 5.1 User Module

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, CompanyEntity]),
    CqrsModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [
    AuthController,
    UserController,
    UserViewController,
  ],
  providers: [
    // Domain Services
    UserDomainService,
    AuthenticationService,
    
    // Application Services
    CreateUserHandler,
    UpdateUserHandler,
    GetUserByIdHandler,
    
    // Infrastructure
    UserRepository,
    UserReadModelRepository,
    
    // Strategies
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
  ],
  exports: [UserDomainService],
})
export class UserModule {}
```

### 5.2 Product Module

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      CategoryEntity,
      BrandEntity,
      InventoryEntity,
    ]),
    ElasticsearchModule.register({
      node: process.env.ELASTICSEARCH_NODE,
    }),
    CqrsModule,
  ],
  controllers: [
    ProductController,
    ProductViewController,
    CategoryController,
  ],
  providers: [
    // Domain Services
    ProductDomainService,
    PricingService,
    InventoryService,
    
    // Command Handlers
    CreateProductHandler,
    UpdateProductHandler,
    UpdateInventoryHandler,
    
    // Query Handlers
    GetProductsHandler,
    GetProductByIdHandler,
    SearchProductsHandler,
    
    // Infrastructure
    ProductRepository,
    ProductReadModelRepository,
    ProductSearchService,
  ],
  exports: [ProductDomainService, PricingService],
})
export class ProductModule {}
```

### 5.3 Order Module

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemEntity,
      InvoiceEntity,
    ]),
    CqrsModule,
    BullModule.registerQueue({
      name: 'order-processing',
    }),
  ],
  controllers: [
    OrderController,
    OrderViewController,
    InvoiceController,
  ],
  providers: [
    // Domain Services
    OrderDomainService,
    OrderValidationService,
    
    // Command Handlers
    CreateOrderHandler,
    UpdateOrderStatusHandler,
    CancelOrderHandler,
    
    // Query Handlers
    GetOrdersHandler,
    GetOrderByIdHandler,
    GetOrderHistoryHandler,
    
    // Event Handlers
    OrderPlacedEventHandler,
    OrderShippedEventHandler,
    
    // Infrastructure
    OrderRepository,
    OrderReadModelRepository,
    
    // Processors
    OrderProcessor,
  ],
  exports: [OrderDomainService],
})
export class OrderModule {}
```

---

## 6. API Specifications

### 6.1 RESTful API Endpoints

#### Authentication Endpoints
```
POST   /api/auth/login          - User login
POST   /api/auth/logout         - User logout  
POST   /api/auth/refresh        - Refresh JWT token
POST   /api/auth/register       - New company registration
POST   /api/auth/forgot-password - Password reset request
POST   /api/auth/reset-password  - Password reset confirmation
GET    /api/auth/verify-email   - Email verification
```

#### Product Endpoints
```
GET    /api/products            - List products with filters
GET    /api/products/:id        - Get product details
GET    /api/products/search     - Full-text product search
GET    /api/products/:id/pricing - Get tiered pricing
GET    /api/products/:id/availability - Check stock availability
POST   /api/products/bulk-check - Bulk availability check
```

#### Cart Endpoints
```
GET    /api/cart               - Get current cart
POST   /api/cart/items         - Add item to cart
PUT    /api/cart/items/:id     - Update item quantity
DELETE /api/cart/items/:id     - Remove item from cart
POST   /api/cart/clear         - Clear entire cart
POST   /api/cart/validate      - Validate cart items
POST   /api/cart/save-for-later - Move items to wishlist
```

#### Order Endpoints
```
GET    /api/orders              - List user orders
GET    /api/orders/:id          - Get order details
POST   /api/orders              - Create new order
PUT    /api/orders/:id          - Update order (if allowed)
POST   /api/orders/:id/cancel   - Cancel order
GET    /api/orders/:id/invoice  - Download invoice PDF
POST   /api/orders/quick-reorder - Reorder from history
GET    /api/orders/templates    - Get order templates
```

#### Quote Endpoints
```
POST   /api/quotes/request      - Submit RFQ
GET    /api/quotes              - List quotes
GET    /api/quotes/:id          - Get quote details
POST   /api/quotes/:id/accept   - Accept quote
POST   /api/quotes/:id/negotiate - Counter quote
```

### 6.2 GraphQL Schema (Optional Alternative)

```graphql
type Query {
  # Product queries
  products(filter: ProductFilter, pagination: PaginationInput): ProductConnection!
  product(id: ID!): Product
  productSearch(query: String!, filters: SearchFilters): SearchResult!
  
  # Order queries
  orders(filter: OrderFilter, pagination: PaginationInput): OrderConnection!
  order(id: ID!): Order
  
  # Cart queries
  cart: Cart!
  
  # User queries
  me: User!
  myCompany: Company!
}

type Mutation {
  # Auth mutations
  login(email: String!, password: String!): AuthPayload!
  logout: Boolean!
  refreshToken(token: String!): AuthPayload!
  
  # Cart mutations
  addToCart(productId: ID!, quantity: Int!): Cart!
  updateCartItem(itemId: ID!, quantity: Int!): Cart!
  removeFromCart(itemId: ID!): Cart!
  clearCart: Cart!
  
  # Order mutations
  createOrder(input: CreateOrderInput!): Order!
  cancelOrder(id: ID!): Order!
  
  # Quote mutations
  requestQuote(input: RequestQuoteInput!): Quote!
  respondToQuote(id: ID!, response: QuoteResponseInput!): Quote!
}

type Subscription {
  orderStatusUpdated(orderId: ID!): Order!
  inventoryUpdated(productIds: [ID!]!): [Product!]!
  priceChanged(productIds: [ID!]!): [Product!]!
}
```

---

## 7. Security Considerations

### 7.1 Authentication & Authorization
- **JWT Token Security**: Short-lived access tokens (15 min) with refresh tokens
- **Rate Limiting**: IP-based and user-based rate limiting
- **CORS Configuration**: Whitelist allowed origins
- **Helmet.js**: Security headers configuration

### 7.2 Data Protection
- **Field-Level Encryption**: PII encryption at rest
- **Audit Logging**: Comprehensive audit trail
- **Data Masking**: Sensitive data masking in logs
- **GDPR Compliance**: Data privacy controls

### 7.3 Input Validation
- **DTO Validation**: class-validator decorators
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **File Upload Security**: Type validation, size limits, virus scanning

---

## 8. Performance Optimization

### 8.1 Caching Strategy
- **Redis Caching**: Product catalog, user sessions, API responses
- **CDN Integration**: Static assets and media files
- **Database Query Caching**: Frequently accessed data
- **Browser Caching**: Appropriate cache headers

### 8.2 Database Optimization
- **Read Replicas**: Separate read/write databases
- **Connection Pooling**: Optimized connection management
- **Lazy Loading**: On-demand data fetching
- **Database Indexing**: Strategic index placement

### 8.3 Asynchronous Processing
- **Message Queues**: Order processing, email notifications
- **Background Jobs**: Report generation, data synchronization
- **Event-Driven Architecture**: Loose coupling between services

---

## 9. Testing Strategy

### 9.1 Test Types
- **Unit Tests**: Domain logic, value objects, entities
- **Integration Tests**: Repository, API endpoints
- **End-to-End Tests**: Critical user journeys
- **Performance Tests**: Load testing, stress testing

### 9.2 Test Coverage Goals
- **Domain Layer**: 95% coverage
- **Application Layer**: 85% coverage
- **Infrastructure Layer**: 70% coverage
- **Overall**: 80% minimum coverage

---

## 10. Deployment & DevOps

### 10.1 Container Strategy
```dockerfile
# Multi-stage Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### 10.2 CI/CD Pipeline
- **Build Stage**: TypeScript compilation, asset bundling
- **Test Stage**: Unit tests, integration tests, linting
- **Security Scan**: Dependency vulnerability scanning
- **Deploy Stage**: Blue-green deployment to staging/production

### 10.3 Monitoring & Logging
- **Application Monitoring**: APM integration (New Relic/DataDog)
- **Error Tracking**: Sentry integration
- **Centralized Logging**: ELK Stack or CloudWatch
- **Health Checks**: Kubernetes liveness/readiness probes

---

## 11. Scalability Considerations

### 11.1 Horizontal Scaling
- **Stateless Services**: Session storage in Redis
- **Load Balancing**: Application load balancer configuration
- **Auto-scaling**: CPU/Memory based scaling policies

### 11.2 Microservices Migration Path
- **Service Boundaries**: Clear bounded contexts
- **API Gateway**: Central entry point for microservices
- **Service Mesh**: Istio/Linkerd for service communication
- **Event Bus**: RabbitMQ/Kafka for inter-service communication

---

## 12. Conclusion

This B2B e-commerce platform specification provides a comprehensive foundation for building a robust, scalable, and maintainable system using NestJS with Clean Architecture, CQRS, and DDD principles. The modular design ensures flexibility for future enhancements while maintaining code quality and business logic integrity.

The implementation should prioritize:
1. **Business Logic Isolation**: Keep domain logic pure and testable
2. **Scalability**: Design for horizontal scaling from the start
3. **User Experience**: Fast, responsive UI with server-side rendering
4. **Maintainability**: Clear separation of concerns and comprehensive documentation
5. **Security**: Defense-in-depth approach with multiple security layers

Regular reviews and iterations based on user feedback and business requirements will ensure the platform continues to meet evolving B2B commerce needs.
