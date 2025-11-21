# Tasks: B2B E-Commerce Platform MVP

**Input**: Design documents from `/specs/001-b2b-ecommerce-platform/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓

**Tests**: Tests are included as they are required for 90% code coverage target per plan.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Project Structure**: NestJS monolith with modular bounded contexts
- **Base Path**: `apps/api/src/`
- **Modules**: `modules/{bounded-context}/`
- **Layers**: `domain/`, `application/`, `infrastructure/`, `presentation/`
- **Tests**: `test/unit/`, `test/integration/`, `test/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create NestJS project structure in apps/api/ with TypeScript configuration
- [x] T002 [P] Initialize package.json with dependencies: @nestjs/core, @nestjs/common, @nestjs/cqrs, @nestjs/typeorm, typeorm, @nestjs/microservices, handlebars, hbs, class-validator, class-transformer, @keycloak/keycloak-admin-client
- [x] T003 [P] Configure TypeScript (tsconfig.json) with strict mode and path aliases in apps/api/
- [x] T004 [P] Setup Jest configuration (jest.config.js) with 90% coverage threshold in apps/api/
- [x] T005 [P] Configure ESLint and Prettier for code quality in apps/api/
- [x] T006 [P] Setup Tailwind CSS configuration (tailwind.config.js) and PostCSS in apps/api/
- [x] T007 [P] Create nest-cli.json with Handlebars template compilation settings in apps/api/
- [x] T008 Create .env.example with required environment variables (database, Keycloak, RabbitMQ) in apps/api/
- [x] T009 [P] Setup GitHub Actions CI workflow (.github/workflows/ci.yml) for tests and coverage
- [x] T010 Create basic README.md with project overview and setup instructions in apps/api/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Shared Kernel (Domain Foundation)

- [x] T011 Create base aggregate root class in apps/api/src/shared/domain/aggregate-root.base.ts
- [x] T012 [P] Create base entity class in apps/api/src/shared/domain/entity.base.ts
- [x] T013 [P] Create base value object class in apps/api/src/shared/domain/value-object.base.ts
- [x] T014 [P] Create base domain event class in apps/api/src/shared/domain/domain-event.base.ts
- [x] T015 [P] Create Result type for error handling in apps/api/src/shared/domain/result.ts
- [x] T016 [P] Create base command class in apps/api/src/shared/application/base-command.ts
- [x] T017 [P] Create base query class in apps/api/src/shared/application/base-query.ts
- [x] T018 [P] Create pagination DTO in apps/api/src/shared/application/pagination.dto.ts

### Database Infrastructure

- [x] T019 Create database configuration module in apps/api/src/config/database.config.ts
- [x] T020 Setup TypeORM connection configuration with PostgreSQL in apps/api/src/config/database.config.ts
- [x] T021 Create base repository interface in apps/api/src/shared/infrastructure/database/base.repository.ts
- [x] T022 Create unit of work pattern implementation in apps/api/src/shared/infrastructure/database/unit-of-work.ts
- [x] T023 Create database migration setup and initial migration structure in apps/api/src/migrations/

### Outbox Pattern (Event Infrastructure)

- [x] T024 Create Outbox entity (TypeORM) in apps/api/src/shared/infrastructure/outbox/outbox.entity.ts
- [x] T025 Create Outbox service for inserting events in apps/api/src/shared/infrastructure/outbox/outbox.service.ts
- [x] T026 Create Outbox processor for polling and publishing to RabbitMQ in apps/api/src/shared/infrastructure/outbox/outbox.processor.ts
- [x] T027 Create database migration for outbox table in apps/api/src/migrations/

### RabbitMQ Messaging

- [x] T028 Create RabbitMQ configuration module in apps/api/src/config/rabbitmq.config.ts
- [x] T029 Create message broker service in apps/api/src/shared/infrastructure/messaging/message-broker.service.ts
- [x] T030 Create event publisher service in apps/api/src/shared/infrastructure/messaging/event-publisher.service.ts
- [x] T031 Setup RabbitMQ connection and exchange/queue topology in apps/api/src/shared/infrastructure/messaging/

### Keycloak Authentication

- [x] T032 Create Keycloak configuration module in apps/api/src/config/keycloak.config.ts
- [x] T033 Create Keycloak auth service in apps/api/src/modules/identity/application/services/keycloak-auth.service.ts
- [x] T034 Create Keycloak JWT strategy in apps/api/src/modules/identity/application/strategies/jwt.strategy.ts
- [x] T035 Create Keycloak auth guard in apps/api/src/modules/identity/application/guards/keycloak-auth.guard.ts
- [x] T036 Create JWT auth guard in apps/api/src/modules/identity/application/guards/jwt-auth.guard.ts
- [x] T037 Create auth controller with callback and logout endpoints in apps/api/src/modules/identity/presentation/controllers/auth.controller.ts
- [x] T038 Create Identity module with all providers in apps/api/src/modules/identity/identity.module.ts

### Application Configuration

- [x] T039 Create app configuration module in apps/api/src/config/app.config.ts
- [x] T040 Setup ConfigModule with all feature configs in apps/api/src/config/
- [x] T041 Create main application bootstrap in apps/api/src/main.ts
- [x] T042 Create root AppModule in apps/api/src/app.module.ts

### Common Infrastructure

- [x] T043 Create exception filter for error handling in apps/api/src/common/filters/http-exception.filter.ts
- [x] T044 [P] Create validation pipe in apps/api/src/common/pipes/validation.pipe.ts
- [x] T045 [P] Create logging interceptor in apps/api/src/common/interceptors/logging.interceptor.ts
- [x] T046 [P] Create request logging middleware in apps/api/src/common/middleware/request-logger.middleware.ts

### Handlebars Templating Setup

- [x] T047 Configure Handlebars engine in main.ts for server-side rendering
- [x] T048 Create base template structure (public.hbs, authenticated.hbs, admin.hbs) in apps/api/src/views/templates/
- [x] T049 Create view helpers registration for Handlebars in apps/api/src/views/helpers/

### Testing Infrastructure

- [x] T050 Create test database setup utilities in apps/api/test/helpers/database.helper.ts
- [x] T051 Create test factories for domain entities in apps/api/test/factories/
- [ ] T052 Create Keycloak mock for integration tests in apps/api/test/helpers/keycloak.helper.ts
- [ ] T053 Create RabbitMQ test utilities in apps/api/test/helpers/messaging.helper.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Browse and Search Products (Priority: P1) 🎯 MVP

**Goal**: Enable B2B buyers to search and browse products with filtering, variant support, and detailed product views

**Independent Test**: Can be fully tested by loading product catalog, performing searches, applying filters, and verifying results appear correctly. Delivers immediate value by allowing users to discover available products.

### Tests for User Story 1

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T054 [P] [US1] Create unit test for Product aggregate in apps/api/test/unit/product-catalog/product.aggregate.spec.ts
- [x] T055 [P] [US1] Create unit test for ProductVariant entity in apps/api/test/unit/product-catalog/product-variant.entity.spec.ts
- [x] T056 [P] [US1] Create unit test for Category aggregate in apps/api/test/unit/product-catalog/category.aggregate.spec.ts
- [x] T057 [P] [US1] Create unit test for SKU value object in apps/api/test/unit/product-catalog/sku.value-object.spec.ts
- [x] T058 [P] [US1] Create unit test for Price value object in apps/api/test/unit/product-catalog/price.value-object.spec.ts
- [x] T059 [P] [US1] Create unit test for Inventory value object in apps/api/test/unit/product-catalog/inventory.value-object.spec.ts
- [x] T060 [P] [US1] Create integration test for ProductRepository in apps/api/test/integration/product-catalog/product.repository.spec.ts
- [x] T061 [P] [US1] Create integration test for CategoryRepository in apps/api/test/integration/product-catalog/category.repository.spec.ts
- [x] T062 [P] [US1] Create integration test for SearchProductsQuery handler in apps/api/test/integration/product-catalog/search-products.handler.spec.ts
- [x] T063 [P] [US1] Create E2E test for product browsing flow in apps/api/test/e2e/product-browsing.e2e-spec.ts

### Implementation for User Story 1

#### Domain Layer

- [x] T064 [P] [US1] Create SKU value object in apps/api/src/modules/product-catalog/domain/value-objects/sku.ts
- [x] T065 [P] [US1] Create Price value object in apps/api/src/modules/product-catalog/domain/value-objects/price.ts
- [x] T066 [P] [US1] Create Inventory value object in apps/api/src/modules/product-catalog/domain/value-objects/inventory.ts
- [x] T067 [P] [US1] Create ProductImage value object in apps/api/src/modules/product-catalog/domain/value-objects/product-image.ts
- [x] T068 [P] [US1] Create ProductVariant entity in apps/api/src/modules/product-catalog/domain/entities/product-variant.ts
- [x] T069 [US1] Create Product aggregate root in apps/api/src/modules/product-catalog/domain/aggregates/product.ts
- [x] T070 [US1] Create Category aggregate root in apps/api/src/modules/product-catalog/domain/aggregates/category.ts
- [x] T071 [US1] Create ProductCreated domain event in apps/api/src/modules/product-catalog/domain/events/product-created.ts
- [x] T072 [US1] Create ProductUpdated domain event in apps/api/src/modules/product-catalog/domain/events/product-updated.ts
- [x] T073 [US1] Create InventoryReserved domain event in apps/api/src/modules/product-catalog/domain/events/inventory-reserved.ts
- [x] T074 [US1] Create InventoryReleased domain event in apps/api/src/modules/product-catalog/domain/events/inventory-released.ts
- [x] T075 [US1] Create IProductRepository interface in apps/api/src/modules/product-catalog/domain/repositories/iproduct-repository.ts
- [x] T076 [US1] Create ICategoryRepository interface in apps/api/src/modules/product-catalog/domain/repositories/icategory-repository.ts

#### Application Layer (CQRS)

- [x] T077 [US1] Create SearchProductsQuery in apps/api/src/modules/product-catalog/application/queries/search-products.query.ts
- [x] T078 [US1] Create GetProductByIdQuery in apps/api/src/modules/product-catalog/application/queries/get-product-by-id.query.ts
- [x] T079 [US1] Create GetCategoriesQuery in apps/api/src/modules/product-catalog/application/queries/get-categories.query.ts
- [x] T080 [US1] Create SearchProductsQueryHandler in apps/api/src/modules/product-catalog/application/handlers/search-products.handler.ts
- [x] T081 [US1] Create GetProductByIdQueryHandler in apps/api/src/modules/product-catalog/application/handlers/get-product-by-id.handler.ts
- [x] T082 [US1] Create GetCategoriesQueryHandler in apps/api/src/modules/product-catalog/application/handlers/get-categories.handler.ts
- [x] T083 [US1] Create ProductDto for query responses in apps/api/src/modules/product-catalog/application/dtos/product.dto.ts
- [x] T084 [US1] Create ProductVariantDto in apps/api/src/modules/product-catalog/application/dtos/product-variant.dto.ts
- [x] T085 [US1] Create CategoryDto in apps/api/src/modules/product-catalog/application/dtos/category.dto.ts

#### Infrastructure Layer

- [x] T086 [US1] Create Product entity (TypeORM) in apps/api/src/modules/product-catalog/infrastructure/persistence/entities/product.entity.ts
- [x] T087 [US1] Create ProductVariant entity (TypeORM) in apps/api/src/modules/product-catalog/infrastructure/persistence/entities/product-variant.entity.ts
- [x] T088 [US1] Create Category entity (TypeORM) in apps/api/src/modules/product-catalog/infrastructure/persistence/entities/category.entity.ts
- [x] T089 [US1] Create ProductRepository implementation in apps/api/src/modules/product-catalog/infrastructure/persistence/repositories/product.repository.ts
- [x] T090 [US1] Create CategoryRepository implementation in apps/api/src/modules/product-catalog/infrastructure/persistence/repositories/category.repository.ts
- [x] T091 [US1] Create domain-to-persistence mapper in apps/api/src/modules/product-catalog/infrastructure/persistence/mappers/product.mapper.ts
- [x] T092 [US1] Create database migration for products, variants, and categories tables in apps/api/src/migrations/
- [x] T093 [US1] Create ProductReadModel entity for CQRS queries in apps/api/src/modules/product-catalog/infrastructure/persistence/read-models/product-read-model.entity.ts
- [x] T094 [US1] Create event handlers for synchronizing read models in apps/api/src/modules/product-catalog/infrastructure/events/product-event.handlers.ts

#### Presentation Layer

- [x] T095 [US1] Create ProductController with GET /api/products endpoint in apps/api/src/modules/product-catalog/presentation/controllers/product.controller.ts
- [x] T096 [US1] Create ProductController with GET /api/products/search endpoint in apps/api/src/modules/product-catalog/presentation/controllers/product.controller.ts
- [x] T097 [US1] Create ProductController with GET /api/products/:id endpoint in apps/api/src/modules/product-catalog/presentation/controllers/product.controller.ts
- [x] T098 [US1] Create CategoryController with GET /api/categories endpoint in apps/api/src/modules/product-catalog/presentation/controllers/category.controller.ts
- [x] T099 [US1] Create products.hbs page template in apps/api/src/views/pages/products.hbs
- [x] T100 [US1] Create product-detail.hbs page template in apps/api/src/views/pages/product-detail.hbs
- [x] T101 [US1] Create product-card.hbs molecule component in apps/api/src/views/components/molecules/product-card.hbs
- [x] T102 [US1] Create product-grid.hbs organism component in apps/api/src/views/components/organisms/product-grid.hbs
- [x] T103 [US1] Create search-bar.hbs molecule component in apps/api/src/views/components/molecules/search-bar.hbs
- [x] T104 [US1] Create view model builders (presenters) for product pages in apps/api/src/modules/product-catalog/presentation/presenters/product.presenter.ts
- [x] T105 [US1] Create ProductCatalogModule with all providers in apps/api/src/modules/product-catalog/product-catalog.module.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can browse, search, filter, and view product details with variants.

---

## Phase 4: User Story 2 - Add Products to Cart and Checkout (Priority: P1) 🎯 MVP

**Goal**: Enable B2B buyers to add products to cart, manage cart contents, and complete checkout to place orders

**Independent Test**: Can be tested by adding products to cart, modifying quantities, entering shipping information, and completing an order. Delivers the fundamental value proposition of purchasing products.

### Tests for User Story 2

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T106 [P] [US2] Create unit test for Cart aggregate in apps/api/test/unit/order-management/cart.aggregate.spec.ts
- [x] T107 [P] [US2] Create unit test for CartItem entity in apps/api/test/unit/order-management/cart-item.entity.spec.ts
- [x] T108 [P] [US2] Create unit test for Order aggregate in apps/api/test/unit/order-management/order.aggregate.spec.ts
- [x] T109 [P] [US2] Create unit test for OrderItem entity in apps/api/test/unit/order-management/order-item.entity.spec.ts
- [x] T110 [P] [US2] Create unit test for OrderNumber value object in apps/api/test/unit/order-management/order-number.value-object.spec.ts
- [x] T111 [P] [US2] Create unit test for Address value object in apps/api/test/unit/order-management/address.value-object.spec.ts
- [x] T112 [P] [US2] Create unit test for OrderStatus value object in apps/api/test/unit/order-management/order-status.value-object.spec.ts
- [ ] T113 [P] [US2] Create integration test for CartRepository in apps/api/test/integration/order-management/cart.repository.spec.ts
- [ ] T114 [P] [US2] Create integration test for OrderRepository in apps/api/test/integration/order-management/order.repository.spec.ts
- [ ] T115 [P] [US2] Create integration test for AddToCartCommand handler in apps/api/test/integration/order-management/add-to-cart.handler.spec.ts
- [ ] T116 [P] [US2] Create integration test for PlaceOrderCommand handler in apps/api/test/integration/order-management/place-order.handler.spec.ts
- [x] T117 [P] [US2] Create E2E test for checkout flow in apps/api/test/e2e/checkout.e2e-spec.ts

### Implementation for User Story 2

#### Domain Layer

- [x] T118 [P] [US2] Create OrderNumber value object in apps/api/src/modules/order-management/domain/value-objects/order-number.ts
- [x] T119 [P] [US2] Create Address value object in apps/api/src/modules/order-management/domain/value-objects/address.ts
- [x] T120 [P] [US2] Create OrderStatus value object in apps/api/src/modules/order-management/domain/value-objects/order-status.ts
- [x] T121 [P] [US2] Create CartStatus value object in apps/api/src/modules/order-management/domain/value-objects/cart-status.ts
- [x] T122 [US2] Create CartItem entity in apps/api/src/modules/order-management/domain/entities/cart-item.ts
- [x] T123 [US2] Create Cart aggregate root in apps/api/src/modules/order-management/domain/aggregates/cart.ts
- [x] T124 [US2] Create OrderItem entity in apps/api/src/modules/order-management/domain/entities/order-item.ts
- [x] T125 [US2] Create Order aggregate root in apps/api/src/modules/order-management/domain/aggregates/order.ts
- [x] T126 [US2] Create ItemAddedToCart domain event in apps/api/src/modules/order-management/domain/events/item-added-to-cart.ts
- [x] T127 [US2] Create ItemRemovedFromCart domain event in apps/api/src/modules/order-management/domain/events/item-removed-from-cart.ts
- [x] T128 [US2] Create CartCleared domain event in apps/api/src/modules/order-management/domain/events/cart-cleared.ts
- [x] T129 [US2] Create OrderPlaced domain event in apps/api/src/modules/order-management/domain/events/order-placed.ts
- [x] T130 [US2] Create OrderCancelled domain event in apps/api/src/modules/order-management/domain/events/order-cancelled.ts
- [x] T131 [US2] Create InventoryReservationRequested domain event in apps/api/src/modules/order-management/domain/events/inventory-reservation-requested.ts
- [x] T132 [US2] Create ICartRepository interface in apps/api/src/modules/order-management/domain/repositories/icart-repository.ts
- [x] T133 [US2] Create IOrderRepository interface in apps/api/src/modules/order-management/domain/repositories/iorder-repository.ts

#### Application Layer (CQRS)

- [x] T134 [US2] Create AddToCartCommand in apps/api/src/modules/order-management/application/commands/add-to-cart.command.ts
- [x] T135 [US2] Create UpdateCartItemCommand in apps/api/src/modules/order-management/application/commands/update-cart-item.command.ts
- [x] T136 [US2] Create RemoveFromCartCommand in apps/api/src/modules/order-management/application/commands/remove-from-cart.command.ts
- [x] T137 [US2] Create ClearCartCommand in apps/api/src/modules/order-management/application/commands/clear-cart.command.ts
- [x] T138 [US2] Create PlaceOrderCommand in apps/api/src/modules/order-management/application/commands/place-order.command.ts
- [x] T139 [US2] Create CancelOrderCommand in apps/api/src/modules/order-management/application/commands/cancel-order.command.ts
- [x] T140 [US2] Create AddToCartCommandHandler in apps/api/src/modules/order-management/application/handlers/add-to-cart.handler.ts
- [x] T141 [US2] Create UpdateCartItemCommandHandler in apps/api/src/modules/order-management/application/handlers/update-cart-item.handler.ts
- [x] T142 [US2] Create RemoveFromCartCommandHandler in apps/api/src/modules/order-management/application/handlers/remove-from-cart.handler.ts
- [x] T143 [US2] Create ClearCartCommandHandler in apps/api/src/modules/order-management/application/handlers/clear-cart.handler.ts
- [x] T144 [US2] Create PlaceOrderCommandHandler in apps/api/src/modules/order-management/application/handlers/place-order.handler.ts
- [x] T145 [US2] Create CancelOrderCommandHandler in apps/api/src/modules/order-management/application/handlers/cancel-order.handler.ts
- [x] T146 [US2] Create OrderPlacementSaga for inventory reservation in apps/api/src/modules/order-management/application/sagas/order-placement.saga.ts
- [x] T147 [US2] Create GetCartQuery in apps/api/src/modules/order-management/application/queries/get-cart.query.ts
- [x] T148 [US2] Create GetCartQueryHandler in apps/api/src/modules/order-management/application/handlers/get-cart.handler.ts
- [x] T149 [US2] Create CartDto in apps/api/src/modules/order-management/application/dtos/cart.dto.ts
- [x] T150 [US2] Create CartItemDto in apps/api/src/modules/order-management/application/dtos/cart-item.dto.ts
- [x] T151 [US2] Create OrderDto in apps/api/src/modules/order-management/application/dtos/order.dto.ts
- [x] T152 [US2] Create OrderItemDto in apps/api/src/modules/order-management/application/dtos/order-item.dto.ts

#### Infrastructure Layer

- [x] T153 [US2] Create Cart entity (TypeORM) in apps/api/src/modules/order-management/infrastructure/persistence/entities/cart.entity.ts
- [x] T154 [US2] Create CartItem entity (TypeORM) in apps/api/src/modules/order-management/infrastructure/persistence/entities/cart-item.entity.ts
- [x] T155 [US2] Create Order entity (TypeORM) in apps/api/src/modules/order-management/infrastructure/persistence/entities/order.entity.ts
- [x] T156 [US2] Create OrderItem entity (TypeORM) in apps/api/src/modules/order-management/infrastructure/persistence/entities/order-item.entity.ts
- [x] T157 [US2] Create CartRepository implementation in apps/api/src/modules/order-management/infrastructure/persistence/repositories/cart.repository.ts
- [x] T158 [US2] Create OrderRepository implementation in apps/api/src/modules/order-management/infrastructure/persistence/repositories/order.repository.ts
- [x] T159 [US2] Create domain-to-persistence mapper for Cart in apps/api/src/modules/order-management/infrastructure/persistence/mappers/cart.mapper.ts
- [x] T160 [US2] Create domain-to-persistence mapper for Order in apps/api/src/modules/order-management/infrastructure/persistence/mappers/order.mapper.ts
- [x] T161 [US2] Create database migration for carts, cart_items, orders, and order_items tables in apps/api/src/migrations/
- [x] T162 [US2] Create event handlers for cart and order events in apps/api/src/modules/order-management/infrastructure/events/order-event.handlers.ts
- [x] T163 [US2] Create email service for order confirmation in apps/api/src/modules/order-management/infrastructure/email/order-email.service.ts

#### Presentation Layer

- [x] T164 [US2] Create CartController with GET /api/cart endpoint in apps/api/src/modules/order-management/presentation/controllers/cart.controller.ts
- [x] T165 [US2] Create CartController with POST /api/cart/items endpoint in apps/api/src/modules/order-management/presentation/controllers/cart.controller.ts
- [x] T166 [US2] Create CartController with PUT /api/cart/items/:itemId endpoint in apps/api/src/modules/order-management/presentation/controllers/cart.controller.ts
- [x] T167 [US2] Create CartController with DELETE /api/cart/items/:itemId endpoint in apps/api/src/modules/order-management/presentation/controllers/cart.controller.ts
- [x] T168 [US2] Create OrderController with POST /api/orders endpoint in apps/api/src/modules/order-management/presentation/controllers/order.controller.ts
- [x] T169 [US2] Create cart.hbs page template in apps/api/src/views/pages/cart.hbs
- [x] T170 [US2] Create checkout.hbs page template in apps/api/src/views/pages/checkout.hbs
- [x] T171 [US2] Create cart-item.hbs molecule component in apps/api/src/views/components/molecules/cart-item.hbs
- [x] T172 [US2] Create checkout-form.hbs organism component in apps/api/src/views/components/organisms/checkout-form.hbs
- [x] T173 [US2] Create view model builders (presenters) for cart and checkout pages in apps/api/src/modules/order-management/presentation/presenters/cart.presenter.ts
- [x] T174 [US2] Create OrderManagementModule with all providers in apps/api/src/modules/order-management/order-management.module.ts

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently. Users can add products to cart, manage cart contents, and complete checkout to place orders.

---

## Phase 5: User Story 3 - View and Track Orders (Priority: P1) 🎯 MVP

**Goal**: Enable B2B buyers to view order history, track current orders, and reorder from past orders

**Independent Test**: Can be tested by placing an order, viewing it in order history, and tracking its status. Delivers value by providing visibility into purchasing activity.

### Tests for User Story 3

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T175 [P] [US3] Create unit test for GetOrderHistoryQuery handler in apps/api/test/unit/order-management/get-order-history.handler.spec.ts
- [x] T176 [P] [US3] Create unit test for GetOrderByIdQuery handler in apps/api/test/unit/order-management/get-order-by-id.handler.spec.ts
- [ ] T177 [P] [US3] Create integration test for GetOrderHistoryQuery handler in apps/api/test/integration/order-management/get-order-history.handler.spec.ts
- [ ] T178 [P] [US3] Create integration test for GetOrderByIdQuery handler in apps/api/test/integration/order-management/get-order-by-id.handler.spec.ts
- [x] T179 [P] [US3] Create E2E test for order history flow in apps/api/test/e2e/order-history.e2e-spec.ts

### Implementation for User Story 3

#### Application Layer (CQRS)

- [x] T180 [US3] Create GetOrderHistoryQuery in apps/api/src/modules/order-management/application/queries/get-order-history.query.ts
- [x] T181 [US3] Create GetOrderByIdQuery in apps/api/src/modules/order-management/application/queries/get-order-by-id.query.ts
- [x] T182 [US3] Create GetOrderHistoryQueryHandler in apps/api/src/modules/order-management/application/handlers/get-order-history.handler.ts
- [x] T183 [US3] Create GetOrderByIdQueryHandler in apps/api/src/modules/order-management/application/handlers/get-order-by-id.handler.ts
- [x] T184 [US3] Create ReorderCommand in apps/api/src/modules/order-management/application/commands/reorder.command.ts
- [x] T185 [US3] Create ReorderCommandHandler in apps/api/src/modules/order-management/application/handlers/reorder.handler.ts
- [x] T186 [US3] Create OrderHistoryReadModel DTO in apps/api/src/modules/order-management/application/dtos/order-history-read-model.dto.ts

#### Infrastructure Layer

- [x] T187 [US3] Create OrderHistoryReadModel entity for CQRS queries in apps/api/src/modules/order-management/infrastructure/persistence/read-models/order-history-read-model.entity.ts
- [x] T188 [US3] Create event handlers for synchronizing order history read model in apps/api/src/modules/order-management/infrastructure/events/order-history-sync.handlers.ts

#### Presentation Layer

- [x] T189 [US3] Create OrderController with GET /api/orders endpoint in apps/api/src/modules/order-management/presentation/controllers/order.controller.ts
- [x] T190 [US3] Create OrderController with GET /api/orders/:id endpoint in apps/api/src/modules/order-management/presentation/controllers/order.controller.ts
- [x] T191 [US3] Create OrderController with POST /api/orders/:id/reorder endpoint in apps/api/src/modules/order-management/presentation/controllers/order.controller.ts
- [x] T192 [US3] Create orders.hbs page template in apps/api/src/views/pages/orders.hbs
- [x] T193 [US3] Create order-detail.hbs page template in apps/api/src/views/pages/order-detail.hbs
- [x] T194 [US3] Create view model builders (presenters) for order pages in apps/api/src/modules/order-management/presentation/presenters/order.presenter.ts

**Checkpoint**: At this point, User Story 3 should be fully functional and testable independently. Users can view order history, track orders, and reorder from past orders.

---

## Phase 5.5: UI/UX Enhancements (Priority: P1) 🎯 MVP

**Goal**: Enhance the user experience with additional navigation, product information tabs, and improved cart functionality

**Independent Test**: Can be tested by navigating the site, viewing categories, exploring product details tabs, and observing cart badge updates.

### Product Detail Enhancements

- [x] T195a [US1] Add functional tabs (Description, Specifications, Documents, Reviews) to product detail page in apps/api/src/views/pages/product-detail.hbs
- [x] T195b [US1] Add JavaScript tab switching functionality in product-detail.hbs
- [x] T195c [US1] Create migration to add specifications, documents, and reviews columns to products table in apps/api/src/migrations/1732300000000-AddProductMetadataFields.ts
- [x] T195d [US1] Update ProductEntity to include specifications, documents, and reviews fields in apps/api/src/modules/product-catalog/infrastructure/persistence/entities/product.entity.ts
- [x] T195e [US1] Update seed script to include sample specifications, documents, and reviews data in apps/api/src/scripts/seed-database.ts

### Navigation Enhancements

- [x] T196a [US1] Create categories listing page template in apps/api/src/views/pages/categories.hbs
- [x] T196b [US1] Update CategoryController to support HTML rendering for categories page in apps/api/src/modules/product-catalog/presentation/controllers/category.controller.ts
- [x] T196c [US2] Add cart count badge to header navigation in apps/api/src/views/partials/organisms/header.hbs
- [x] T196d [US1] Add categories link to main navigation in header.hbs
- [x] T196e [US3] Add orders link to main navigation in header.hbs
- [x] T196f [US1] Add category icon button to header toolbar in header.hbs

### Cart Functionality Enhancements

- [x] T197a [US2] Add cart count update JavaScript function to product-detail page
- [x] T197b [US2] Update Add to Cart button to show loading states and success feedback
- [x] T197c [US2] Add quantity validation on product detail page

**Checkpoint**: At this point, the UI/UX is enhanced with full product information display, improved navigation, and visual cart feedback.

---

## Phase 6: User Story 4 - Manage Landing Page Content (Priority: P1) 🎯 MVP

**Goal**: Enable site administrators to edit landing page content (hero, trust logos, product showcase, showroom, contact, footer) via CMS without developer assistance

**Independent Test**: Can be tested by logging into admin panel, editing various landing page sections, saving changes, and verifying updates appear on the public landing page. Delivers value by enabling marketing autonomy.

### Tests for User Story 4

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T195 [P] [US4] Create unit test for LandingPageContent aggregate in apps/api/test/unit/landing-cms/landing-page-content.aggregate.spec.ts
- [ ] T196 [P] [US4] Create unit test for HeroSection value object in apps/api/test/unit/landing-cms/hero-section.value-object.spec.ts
- [ ] T197 [P] [US4] Create unit test for TrustLogos value object in apps/api/test/unit/landing-cms/trust-logos.value-object.spec.ts
- [ ] T198 [P] [US4] Create unit test for ProductShowcase value object in apps/api/test/unit/landing-cms/product-showcase.value-object.spec.ts
- [ ] T199 [P] [US4] Create unit test for ShowroomInfo value object in apps/api/test/unit/landing-cms/showroom-info.value-object.spec.ts
- [ ] T200 [P] [US4] Create unit test for ContactSection value object in apps/api/test/unit/landing-cms/contact-section.value-object.spec.ts
- [ ] T201 [P] [US4] Create unit test for FooterContent value object in apps/api/test/unit/landing-cms/footer-content.value-object.spec.ts
- [ ] T202 [P] [US4] Create integration test for LandingContentRepository in apps/api/test/integration/landing-cms/landing-content.repository.spec.ts
- [ ] T203 [P] [US4] Create integration test for UpdateHeroCommand handler in apps/api/test/integration/landing-cms/update-hero.handler.spec.ts
- [ ] T204 [P] [US4] Create E2E test for CMS editing flow in apps/api/test/e2e/landing-cms.e2e-spec.ts

### Implementation for User Story 4

#### Domain Layer

- [ ] T205 [P] [US4] Create HeroSection value object in apps/api/src/modules/landing-cms/domain/value-objects/hero-section.ts
- [ ] T206 [P] [US4] Create TrustLogos value object in apps/api/src/modules/landing-cms/domain/value-objects/trust-logos.ts
- [ ] T207 [P] [US4] Create ProductShowcase value object in apps/api/src/modules/landing-cms/domain/value-objects/product-showcase.ts
- [ ] T208 [P] [US4] Create ShowroomInfo value object in apps/api/src/modules/landing-cms/domain/value-objects/showroom-info.ts
- [ ] T209 [P] [US4] Create ContactSection value object in apps/api/src/modules/landing-cms/domain/value-objects/contact-section.ts
- [ ] T210 [P] [US4] Create FooterContent value object in apps/api/src/modules/landing-cms/domain/value-objects/footer-content.ts
- [ ] T211 [US4] Create LandingPageContent aggregate root in apps/api/src/modules/landing-cms/domain/aggregates/landing-page-content.ts
- [ ] T212 [US4] Create ContentUpdated domain event in apps/api/src/modules/landing-cms/domain/events/content-updated.ts
- [ ] T213 [US4] Create ContentPublished domain event in apps/api/src/modules/landing-cms/domain/events/content-published.ts
- [ ] T214 [US4] Create ILandingContentRepository interface in apps/api/src/modules/landing-cms/domain/repositories/ilanding-content-repository.ts

#### Application Layer (CQRS)

- [ ] T215 [US4] Create UpdateHeroCommand in apps/api/src/modules/landing-cms/application/commands/update-hero.command.ts
- [ ] T216 [US4] Create UpdateTrustLogosCommand in apps/api/src/modules/landing-cms/application/commands/update-trust-logos.command.ts
- [ ] T217 [US4] Create UpdateProductShowcaseCommand in apps/api/src/modules/landing-cms/application/commands/update-product-showcase.command.ts
- [ ] T218 [US4] Create UpdateShowroomInfoCommand in apps/api/src/modules/landing-cms/application/commands/update-showroom-info.command.ts
- [ ] T219 [US4] Create UpdateContactSectionCommand in apps/api/src/modules/landing-cms/application/commands/update-contact-section.command.ts
- [ ] T220 [US4] Create UpdateFooterContentCommand in apps/api/src/modules/landing-cms/application/commands/update-footer-content.command.ts
- [ ] T221 [US4] Create PublishContentCommand in apps/api/src/modules/landing-cms/application/commands/publish-content.command.ts
- [ ] T222 [US4] Create UpdateHeroCommandHandler in apps/api/src/modules/landing-cms/application/handlers/update-hero.handler.ts
- [ ] T223 [US4] Create UpdateTrustLogosCommandHandler in apps/api/src/modules/landing-cms/application/handlers/update-trust-logos.handler.ts
- [ ] T224 [US4] Create UpdateProductShowcaseCommandHandler in apps/api/src/modules/landing-cms/application/handlers/update-product-showcase.handler.ts
- [ ] T225 [US4] Create UpdateShowroomInfoCommandHandler in apps/api/src/modules/landing-cms/application/handlers/update-showroom-info.handler.ts
- [ ] T226 [US4] Create UpdateContactSectionCommandHandler in apps/api/src/modules/landing-cms/application/handlers/update-contact-section.handler.ts
- [ ] T227 [US4] Create UpdateFooterContentCommandHandler in apps/api/src/modules/landing-cms/application/handlers/update-footer-content.handler.ts
- [ ] T228 [US4] Create PublishContentCommandHandler in apps/api/src/modules/landing-cms/application/handlers/publish-content.handler.ts
- [ ] T229 [US4] Create GetLandingContentQuery in apps/api/src/modules/landing-cms/application/queries/get-landing-content.query.ts
- [ ] T230 [US4] Create GetLandingContentQueryHandler in apps/api/src/modules/landing-cms/application/handlers/get-landing-content.handler.ts
- [ ] T231 [US4] Create LandingContentDto in apps/api/src/modules/landing-cms/application/dtos/landing-content.dto.ts
- [ ] T232 [US4] Create UpdateHeroDto in apps/api/src/modules/landing-cms/application/dtos/update-hero.dto.ts
- [ ] T233 [US4] Create UpdateTrustLogosDto in apps/api/src/modules/landing-cms/application/dtos/update-trust-logos.dto.ts
- [ ] T234 [US4] Create UpdateProductShowcaseDto in apps/api/src/modules/landing-cms/application/dtos/update-product-showcase.dto.ts
- [ ] T235 [US4] Create UpdateShowroomInfoDto in apps/api/src/modules/landing-cms/application/dtos/update-showroom-info.dto.ts
- [ ] T236 [US4] Create UpdateContactSectionDto in apps/api/src/modules/landing-cms/application/dtos/update-contact-section.dto.ts
- [ ] T237 [US4] Create UpdateFooterContentDto in apps/api/src/modules/landing-cms/application/dtos/update-footer-content.dto.ts

#### Infrastructure Layer

- [ ] T238 [US4] Create LandingPageContent entity (TypeORM) in apps/api/src/modules/landing-cms/infrastructure/persistence/entities/landing-page-content.entity.ts
- [ ] T239 [US4] Create LandingContentRepository implementation in apps/api/src/modules/landing-cms/infrastructure/persistence/repositories/landing-content.repository.ts
- [ ] T240 [US4] Create domain-to-persistence mapper in apps/api/src/modules/landing-cms/infrastructure/persistence/mappers/landing-content.mapper.ts
- [ ] T241 [US4] Create database migration for landing_page_content table in apps/api/src/migrations/
- [ ] T242 [US4] Create event handlers for content events in apps/api/src/modules/landing-cms/infrastructure/events/content-event.handlers.ts

#### Presentation Layer

- [ ] T243 [US4] Create LandingCmsController with GET /api/cms/landing/hero endpoint in apps/api/src/modules/landing-cms/presentation/controllers/landing-cms.controller.ts
- [ ] T244 [US4] Create LandingCmsController with PUT /api/cms/landing/hero endpoint in apps/api/src/modules/landing-cms/presentation/controllers/landing-cms.controller.ts
- [ ] T245 [US4] Create LandingCmsController with GET /api/cms/landing/trust-logos endpoint in apps/api/src/modules/landing-cms/presentation/controllers/landing-cms.controller.ts
- [ ] T246 [US4] Create LandingCmsController with POST /api/cms/landing/trust-logos endpoint in apps/api/src/modules/landing-cms/presentation/controllers/landing-cms.controller.ts
- [ ] T247 [US4] Create LandingCmsController with DELETE /api/cms/landing/trust-logos/:id endpoint in apps/api/src/modules/landing-cms/presentation/controllers/landing-cms.controller.ts
- [ ] T248 [US4] Create LandingCmsController with GET /api/cms/landing/showcase endpoint in apps/api/src/modules/landing-cms/presentation/controllers/landing-cms.controller.ts
- [ ] T249 [US4] Create LandingCmsController with PUT /api/cms/landing/showcase endpoint in apps/api/src/modules/landing-cms/presentation/controllers/landing-cms.controller.ts
- [ ] T250 [US4] Create LandingCmsController with GET /api/cms/landing/preview endpoint in apps/api/src/modules/landing-cms/presentation/controllers/landing-cms.controller.ts
- [ ] T251 [US4] Create LandingCmsController with POST /api/cms/landing/publish endpoint in apps/api/src/modules/landing-cms/presentation/controllers/landing-cms.controller.ts
- [ ] T252 [US4] Create landing.hbs page template (public view) in apps/api/src/views/pages/landing.hbs
- [ ] T253 [US4] Create admin-cms.hbs page template (admin interface) in apps/api/src/views/pages/admin-cms.hbs
- [ ] T254 [US4] Create header.hbs organism component in apps/api/src/views/components/organisms/header.hbs
- [ ] T255 [US4] Create footer.hbs organism component in apps/api/src/views/components/organisms/footer.hbs
- [ ] T256 [US4] Create view model builders (presenters) for landing page in apps/api/src/modules/landing-cms/presentation/presenters/landing.presenter.ts
- [ ] T257 [US4] Create LandingCmsModule with all providers in apps/api/src/modules/landing-cms/landing-cms.module.ts

**Checkpoint**: At this point, User Story 4 should be fully functional and testable independently. Administrators can edit all landing page sections via CMS and see changes reflected on the public landing page.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Integration & Cross-Module Features

- [ ] T258 [P] Integrate all modules in AppModule with proper dependency injection in apps/api/src/app.module.ts
- [ ] T259 [P] Setup route guards for authenticated pages (cart, checkout, orders, admin CMS) using KeycloakAuthGuard
- [ ] T260 [P] Setup API endpoint guards for protected operations using JwtAuthGuard
- [ ] T261 [P] Create navigation menu component with authentication-aware links in apps/api/src/views/components/organisms/nav-menu.hbs
- [ ] T262 [P] Implement session persistence for cart across browser sessions in apps/api/src/modules/order-management/infrastructure/persistence/repositories/cart.repository.ts

### Inventory Management Integration

- [ ] T263 Create Inventory entity (TypeORM) in apps/api/src/modules/product-catalog/infrastructure/persistence/entities/inventory.entity.ts
- [ ] T264 Create InventoryRepository implementation in apps/api/src/modules/product-catalog/infrastructure/persistence/repositories/inventory.repository.ts
- [ ] T265 Create database migration for inventory table in apps/api/src/migrations/
- [ ] T266 Implement inventory reservation logic in OrderPlacementSaga
- [ ] T267 Implement inventory release logic when orders are cancelled
- [ ] T268 Create inventory validation service for preventing overselling in apps/api/src/modules/product-catalog/application/services/inventory-validation.service.ts

### Email Notifications

- [ ] T269 [P] Create email template for order confirmation in apps/api/src/modules/order-management/infrastructure/email/templates/order-confirmation.hbs
- [ ] T270 [P] Create email template for order cancellation in apps/api/src/modules/order-management/infrastructure/email/templates/order-cancellation.hbs
- [ ] T271 [P] Integrate email service with SMTP configuration in apps/api/src/config/email.config.ts
- [ ] T272 [P] Setup email event handlers for order events in apps/api/src/modules/order-management/infrastructure/events/email-event.handlers.ts

### Performance & Optimization

- [ ] T273 [P] Implement database query optimization with indexes for product search in apps/api/src/migrations/
- [ ] T274 [P] Implement caching strategy for product catalog queries in apps/api/src/modules/product-catalog/infrastructure/cache/product-cache.service.ts
- [ ] T275 [P] Optimize Handlebars template rendering with partial caching
- [ ] T276 [P] Setup static asset serving and CDN configuration for images in apps/api/src/main.ts

### Testing & Quality

- [ ] T277 [P] Run full test suite and ensure 90% code coverage threshold is met
- [ ] T278 [P] Create integration tests for cross-module interactions in apps/api/test/integration/cross-module/
- [ ] T279 [P] Create E2E tests for complete user journeys (browse → cart → checkout → order history) in apps/api/test/e2e/
- [ ] T280 [P] Setup test coverage reporting in CI pipeline

### Documentation

- [ ] T281 [P] Create API documentation (OpenAPI/Swagger) in apps/api/docs/api/openapi.yaml
- [ ] T282 [P] Create architecture documentation in apps/api/docs/architecture/
- [ ] T283 [P] Create developer quickstart guide in apps/api/quickstart.md
- [ ] T284 [P] Update README.md with complete setup and deployment instructions

### Security & Validation

- [ ] T285 [P] Implement input validation for all DTOs using class-validator decorators
- [ ] T286 [P] Add rate limiting for API endpoints in apps/api/src/common/middleware/rate-limiter.middleware.ts
- [ ] T287 [P] Implement CSRF protection for form submissions
- [ ] T288 [P] Add security headers middleware in apps/api/src/common/middleware/security-headers.middleware.ts

### Error Handling & Logging

- [ ] T289 [P] Enhance error handling with proper error codes and messages
- [ ] T290 [P] Implement structured logging with correlation IDs
- [ ] T291 [P] Create error pages (404, 500) in apps/api/src/views/pages/error.hbs

### UI/UX Polish

- [ ] T292 [P] Create responsive design for mobile devices using Tailwind CSS
- [ ] T293 [P] Implement loading states and spinners for async operations
- [ ] T294 [P] Add form validation feedback in UI components
- [ ] T295 [P] Create consistent button and input components (atoms) in apps/api/src/views/components/atoms/
- [ ] T296 [P] Implement accessibility features (ARIA labels, keyboard navigation)

---

## Phase 8: User Story 9 - Manage Products and Categories (Priority: P1 - Phase 2) 🎯 Backoffice

**Goal**: Enable administrators to manage products and categories in the catalog through an admin interface with import capabilities

**Independent Test**: Can be tested by creating, updating, and deleting products and categories through the admin interface. Delivers value by enabling catalog management.

### Tests for User Story 9

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T296 [P] [US9] Create unit test for CreateProductCommand handler in apps/api/test/unit/backoffice/create-product.handler.spec.ts
- [ ] T297 [P] [US9] Create unit test for UpdateProductCommand handler in apps/api/test/unit/backoffice/update-product.handler.spec.ts
- [ ] T298 [P] [US9] Create unit test for DeleteProductCommand handler in apps/api/test/unit/backoffice/delete-product.handler.spec.ts
- [ ] T299 [P] [US9] Create unit test for BulkUpdateProductsCommand handler in apps/api/test/unit/backoffice/bulk-update-products.handler.spec.ts
- [ ] T300 [P] [US9] Create unit test for ImportProductsCommand handler in apps/api/test/unit/backoffice/import-products.handler.spec.ts
- [ ] T301 [P] [US9] Create unit test for CreateCategoryCommand handler in apps/api/test/unit/backoffice/create-category.handler.spec.ts
- [ ] T302 [P] [US9] Create integration test for ProductAdminRepository in apps/api/test/integration/backoffice/product-admin.repository.spec.ts
- [ ] T303 [P] [US9] Create integration test for product import service in apps/api/test/integration/backoffice/product-import.service.spec.ts
- [ ] T304 [P] [US9] Create E2E test for product management flow in apps/api/test/e2e/product-management.e2e-spec.ts

### Implementation for User Story 9

#### Domain Layer

- [ ] T305 [US9] Create ProductCreatedByAdmin domain event in apps/api/src/modules/backoffice/domain/events/product-created-by-admin.ts
- [ ] T306 [US9] Create ProductUpdatedByAdmin domain event in apps/api/src/modules/backoffice/domain/events/product-updated-by-admin.ts
- [ ] T307 [US9] Create ProductDeletedByAdmin domain event in apps/api/src/modules/backoffice/domain/events/product-deleted-by-admin.ts
- [ ] T308 [US9] Create CategoryCreatedByAdmin domain event in apps/api/src/modules/backoffice/domain/events/category-created-by-admin.ts

#### Application Layer (CQRS)

- [ ] T309 [US9] Create CreateProductCommand in apps/api/src/modules/backoffice/application/commands/create-product.command.ts
- [ ] T310 [US9] Create UpdateProductCommand in apps/api/src/modules/backoffice/application/commands/update-product.command.ts
- [ ] T311 [US9] Create DeleteProductCommand in apps/api/src/modules/backoffice/application/commands/delete-product.command.ts
- [ ] T312 [US9] Create BulkUpdateProductsCommand in apps/api/src/modules/backoffice/application/commands/bulk-update-products.command.ts
- [ ] T313 [US9] Create ImportProductsCommand in apps/api/src/modules/backoffice/application/commands/import-products.command.ts
- [ ] T314 [US9] Create CreateCategoryCommand in apps/api/src/modules/backoffice/application/commands/create-category.command.ts
- [ ] T315 [US9] Create UpdateCategoryCommand in apps/api/src/modules/backoffice/application/commands/update-category.command.ts
- [ ] T316 [US9] Create DeleteCategoryCommand in apps/api/src/modules/backoffice/application/commands/delete-category.command.ts
- [ ] T317 [US9] Create CreateProductCommandHandler in apps/api/src/modules/backoffice/application/handlers/create-product.handler.ts
- [ ] T318 [US9] Create UpdateProductCommandHandler in apps/api/src/modules/backoffice/application/handlers/update-product.handler.ts
- [ ] T319 [US9] Create DeleteProductCommandHandler in apps/api/src/modules/backoffice/application/handlers/delete-product.handler.ts
- [ ] T320 [US9] Create BulkUpdateProductsCommandHandler in apps/api/src/modules/backoffice/application/handlers/bulk-update-products.handler.ts
- [ ] T321 [US9] Create ImportProductsCommandHandler in apps/api/src/modules/backoffice/application/handlers/import-products.handler.ts
- [ ] T322 [US9] Create CreateCategoryCommandHandler in apps/api/src/modules/backoffice/application/handlers/create-category.handler.ts
- [ ] T323 [US9] Create UpdateCategoryCommandHandler in apps/api/src/modules/backoffice/application/handlers/update-category.handler.ts
- [ ] T324 [US9] Create DeleteCategoryCommandHandler in apps/api/src/modules/backoffice/application/handlers/delete-category.handler.ts
- [ ] T325 [US9] Create ProductImportService for parsing CSV/Excel files in apps/api/src/modules/backoffice/application/services/product-import.service.ts
- [ ] T326 [US9] Create ProductImportValidator for validating imported data in apps/api/src/modules/backoffice/application/services/product-import-validator.service.ts
- [ ] T327 [US9] Create GetProductsQuery for admin product list in apps/api/src/modules/backoffice/application/queries/get-products.query.ts
- [ ] T328 [US9] Create GetProductsQueryHandler in apps/api/src/modules/backoffice/application/handlers/get-products.handler.ts
- [ ] T329 [US9] Create ProductAdminDto in apps/api/src/modules/backoffice/application/dtos/product-admin.dto.ts
- [ ] T330 [US9] Create CategoryAdminDto in apps/api/src/modules/backoffice/application/dtos/category-admin.dto.ts
- [ ] T331 [US9] Create ImportProductsDto in apps/api/src/modules/backoffice/application/dtos/import-products.dto.ts

#### Infrastructure Layer

- [ ] T332 [US9] Create ProductAdminRepository implementation in apps/api/src/modules/backoffice/infrastructure/persistence/repositories/product-admin.repository.ts
- [ ] T333 [US9] Create CategoryAdminRepository implementation in apps/api/src/modules/backoffice/infrastructure/persistence/repositories/category-admin.repository.ts
- [ ] T334 [US9] Create CSV parser service in apps/api/src/modules/backoffice/infrastructure/parsers/csv-parser.service.ts
- [ ] T335 [US9] Create Excel parser service in apps/api/src/modules/backoffice/infrastructure/parsers/excel-parser.service.ts
- [ ] T336 [US9] Create file upload service in apps/api/src/modules/backoffice/infrastructure/storage/file-upload.service.ts
- [ ] T337 [US9] Create ImportJob entity (TypeORM) in apps/api/src/modules/backoffice/infrastructure/persistence/entities/import-job.entity.ts
- [ ] T338 [US9] Create database migration for import_jobs table in apps/api/src/migrations/
- [ ] T339 [US9] Create event handlers for admin product events in apps/api/src/modules/backoffice/infrastructure/events/product-admin-event.handlers.ts

#### Presentation Layer

- [ ] T340 [US9] Create ProductAdminController with GET /api/admin/products endpoint in apps/api/src/modules/backoffice/presentation/controllers/product-admin.controller.ts
- [ ] T341 [US9] Create ProductAdminController with POST /api/admin/products endpoint in apps/api/src/modules/backoffice/presentation/controllers/product-admin.controller.ts
- [ ] T342 [US9] Create ProductAdminController with PUT /api/admin/products/:id endpoint in apps/api/src/modules/backoffice/presentation/controllers/product-admin.controller.ts
- [ ] T343 [US9] Create ProductAdminController with DELETE /api/admin/products/:id endpoint in apps/api/src/modules/backoffice/presentation/controllers/product-admin.controller.ts
- [ ] T344 [US9] Create ProductAdminController with POST /api/admin/products/bulk-update endpoint in apps/api/src/modules/backoffice/presentation/controllers/product-admin.controller.ts
- [ ] T345 [US9] Create ProductAdminController with POST /api/admin/products/import endpoint in apps/api/src/modules/backoffice/presentation/controllers/product-admin.controller.ts
- [ ] T346 [US9] Create CategoryAdminController with CRUD endpoints in apps/api/src/modules/backoffice/presentation/controllers/category-admin.controller.ts
- [ ] T347 [US9] Create product-management.hbs admin page template in apps/api/src/views/pages/admin/product-management.hbs
- [ ] T348 [US9] Create category-management.hbs admin page template in apps/api/src/views/pages/admin/category-management.hbs
- [ ] T349 [US9] Create product-import.hbs admin page template in apps/api/src/views/pages/admin/product-import.hbs
- [ ] T350 [US9] Create view model builders (presenters) for admin pages in apps/api/src/modules/backoffice/presentation/presenters/product-admin.presenter.ts
- [ ] T351 [US9] Create BackofficeModule with all providers in apps/api/src/modules/backoffice/backoffice.module.ts

**Checkpoint**: At this point, User Story 9 should be fully functional. Administrators can manage products and categories, import from CSV/Excel, and perform bulk operations.

---

## Phase 9: User Story 10 - Manage Stores (Priority: P1 - Phase 2) 🎯 Backoffice

**Goal**: Enable administrators to manage store locations and track inventory per store

**Independent Test**: Can be tested by creating stores, assigning inventory to stores, and viewing store-specific data. Delivers value through location-based management.

### Tests for User Story 10

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T352 [P] [US10] Create unit test for Store aggregate in apps/api/test/unit/backoffice/store.aggregate.spec.ts
- [ ] T353 [P] [US10] Create unit test for StoreInventory entity in apps/api/test/unit/backoffice/store-inventory.entity.spec.ts
- [ ] T354 [P] [US10] Create unit test for CreateStoreCommand handler in apps/api/test/unit/backoffice/create-store.handler.spec.ts
- [ ] T355 [P] [US10] Create integration test for StoreRepository in apps/api/test/integration/backoffice/store.repository.spec.ts
- [ ] T356 [P] [US10] Create E2E test for store management flow in apps/api/test/e2e/store-management.e2e-spec.ts

### Implementation for User Story 10

#### Domain Layer

- [ ] T357 [P] [US10] Create StoreAddress value object in apps/api/src/modules/backoffice/domain/value-objects/store-address.ts
- [ ] T358 [US10] Create Store aggregate root in apps/api/src/modules/backoffice/domain/aggregates/store.ts
- [ ] T359 [US10] Create StoreInventory entity in apps/api/src/modules/backoffice/domain/entities/store-inventory.ts
- [ ] T360 [US10] Create StoreCreated domain event in apps/api/src/modules/backoffice/domain/events/store-created.ts
- [ ] T361 [US10] Create StoreUpdated domain event in apps/api/src/modules/backoffice/domain/events/store-updated.ts
- [ ] T362 [US10] Create IStoreRepository interface in apps/api/src/modules/backoffice/domain/repositories/istore-repository.ts

#### Application Layer (CQRS)

- [ ] T363 [US10] Create CreateStoreCommand in apps/api/src/modules/backoffice/application/commands/create-store.command.ts
- [ ] T364 [US10] Create UpdateStoreCommand in apps/api/src/modules/backoffice/application/commands/update-store.command.ts
- [ ] T365 [US10] Create DeleteStoreCommand in apps/api/src/modules/backoffice/application/commands/delete-store.command.ts
- [ ] T366 [US10] Create AssignInventoryToStoreCommand in apps/api/src/modules/backoffice/application/commands/assign-inventory-to-store.command.ts
- [ ] T367 [US10] Create CreateStoreCommandHandler in apps/api/src/modules/backoffice/application/handlers/create-store.handler.ts
- [ ] T368 [US10] Create UpdateStoreCommandHandler in apps/api/src/modules/backoffice/application/handlers/update-store.handler.ts
- [ ] T369 [US10] Create DeleteStoreCommandHandler in apps/api/src/modules/backoffice/application/handlers/delete-store.handler.ts
- [ ] T370 [US10] Create AssignInventoryToStoreCommandHandler in apps/api/src/modules/backoffice/application/handlers/assign-inventory-to-store.handler.ts
- [ ] T371 [US10] Create GetStoresQuery in apps/api/src/modules/backoffice/application/queries/get-stores.query.ts
- [ ] T372 [US10] Create GetStoreByIdQuery in apps/api/src/modules/backoffice/application/queries/get-store-by-id.query.ts
- [ ] T373 [US10] Create GetStoresQueryHandler in apps/api/src/modules/backoffice/application/handlers/get-stores.handler.ts
- [ ] T374 [US10] Create GetStoreByIdQueryHandler in apps/api/src/modules/backoffice/application/handlers/get-store-by-id.handler.ts
- [ ] T375 [US10] Create StoreDto in apps/api/src/modules/backoffice/application/dtos/store.dto.ts
- [ ] T376 [US10] Create StoreInventoryDto in apps/api/src/modules/backoffice/application/dtos/store-inventory.dto.ts

#### Infrastructure Layer

- [ ] T377 [US10] Create Store entity (TypeORM) in apps/api/src/modules/backoffice/infrastructure/persistence/entities/store.entity.ts
- [ ] T378 [US10] Create StoreInventory entity (TypeORM) in apps/api/src/modules/backoffice/infrastructure/persistence/entities/store-inventory.entity.ts
- [ ] T379 [US10] Create StoreRepository implementation in apps/api/src/modules/backoffice/infrastructure/persistence/repositories/store.repository.ts
- [ ] T380 [US10] Create domain-to-persistence mapper for Store in apps/api/src/modules/backoffice/infrastructure/persistence/mappers/store.mapper.ts
- [ ] T381 [US10] Create database migration for stores and store_inventory tables in apps/api/src/migrations/

#### Presentation Layer

- [ ] T382 [US10] Create StoreAdminController with CRUD endpoints in apps/api/src/modules/backoffice/presentation/controllers/store-admin.controller.ts
- [ ] T383 [US10] Create StoreAdminController with POST /api/admin/stores/:id/inventory endpoint in apps/api/src/modules/backoffice/presentation/controllers/store-admin.controller.ts
- [ ] T384 [US10] Create store-management.hbs admin page template in apps/api/src/views/pages/admin/store-management.hbs
- [ ] T385 [US10] Create view model builders (presenters) for store pages in apps/api/src/modules/backoffice/presentation/presenters/store-admin.presenter.ts

**Checkpoint**: At this point, User Story 10 should be fully functional. Administrators can manage stores and assign inventory to store locations.

---

## Phase 10: User Story 11 - Import Orders from Files (Priority: P1 - Phase 2) 🎯 Backoffice

**Goal**: Enable administrators to import orders from CSV or Excel files with validation and error reporting

**Independent Test**: Can be tested by uploading CSV/Excel files with order data, validating imports, and verifying orders are created correctly. Delivers value through efficient bulk processing.

### Tests for User Story 11

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T386 [P] [US11] Create unit test for ImportOrdersCommand handler in apps/api/test/unit/backoffice/import-orders.handler.spec.ts
- [ ] T387 [P] [US11] Create unit test for OrderImportValidator in apps/api/test/unit/backoffice/order-import-validator.spec.ts
- [ ] T388 [P] [US11] Create integration test for order import service in apps/api/test/integration/backoffice/order-import.service.spec.ts
- [ ] T389 [P] [US11] Create E2E test for order import flow in apps/api/test/e2e/order-import.e2e-spec.ts

### Implementation for User Story 11

#### Application Layer (CQRS)

- [ ] T390 [US11] Create ImportOrdersCommand in apps/api/src/modules/backoffice/application/commands/import-orders.command.ts
- [ ] T391 [US11] Create PreviewImportCommand in apps/api/src/modules/backoffice/application/commands/preview-import.command.ts
- [ ] T392 [US11] Create ScheduleImportCommand in apps/api/src/modules/backoffice/application/commands/schedule-import.command.ts
- [ ] T393 [US11] Create ImportOrdersCommandHandler in apps/api/src/modules/backoffice/application/handlers/import-orders.handler.ts
- [ ] T394 [US11] Create PreviewImportCommandHandler in apps/api/src/modules/backoffice/application/handlers/preview-import.handler.ts
- [ ] T395 [US11] Create ScheduleImportCommandHandler in apps/api/src/modules/backoffice/application/handlers/schedule-import.handler.ts
- [ ] T396 [US11] Create OrderImportService for parsing and processing order files in apps/api/src/modules/backoffice/application/services/order-import.service.ts
- [ ] T397 [US11] Create OrderImportValidator for validating imported order data in apps/api/src/modules/backoffice/application/services/order-import-validator.service.ts
- [ ] T398 [US11] Create GetImportJobsQuery in apps/api/src/modules/backoffice/application/queries/get-import-jobs.query.ts
- [ ] T399 [US11] Create GetImportJobsQueryHandler in apps/api/src/modules/backoffice/application/handlers/get-import-jobs.handler.ts
- [ ] T400 [US11] Create ImportOrdersDto in apps/api/src/modules/backoffice/application/dtos/import-orders.dto.ts
- [ ] T401 [US11] Create ImportJobDto in apps/api/src/modules/backoffice/application/dtos/import-job.dto.ts
- [ ] T402 [US11] Create ImportErrorReportDto in apps/api/src/modules/backoffice/application/dtos/import-error-report.dto.ts

#### Infrastructure Layer

- [ ] T403 [US11] Create ImportJobRepository implementation in apps/api/src/modules/backoffice/infrastructure/persistence/repositories/import-job.repository.ts
- [ ] T404 [US11] Create order CSV parser service in apps/api/src/modules/backoffice/infrastructure/parsers/order-csv-parser.service.ts
- [ ] T405 [US11] Create order Excel parser service in apps/api/src/modules/backoffice/infrastructure/parsers/order-excel-parser.service.ts
- [ ] T406 [US11] Create scheduled import processor service in apps/api/src/modules/backoffice/infrastructure/scheduling/scheduled-import-processor.service.ts
- [ ] T407 [US11] Create import job scheduler using cron in apps/api/src/modules/backoffice/infrastructure/scheduling/import-job-scheduler.service.ts

#### Presentation Layer

- [ ] T408 [US11] Create OrderImportController with POST /api/admin/orders/import endpoint in apps/api/src/modules/backoffice/presentation/controllers/order-import.controller.ts
- [ ] T409 [US11] Create OrderImportController with POST /api/admin/orders/import/preview endpoint in apps/api/src/modules/backoffice/presentation/controllers/order-import.controller.ts
- [ ] T410 [US11] Create OrderImportController with GET /api/admin/orders/import/jobs endpoint in apps/api/src/modules/backoffice/presentation/controllers/order-import.controller.ts
- [ ] T411 [US11] Create order-import.hbs admin page template in apps/api/src/views/pages/admin/order-import.hbs
- [ ] T412 [US11] Create view model builders (presenters) for order import pages in apps/api/src/modules/backoffice/presentation/presenters/order-import.presenter.ts

**Checkpoint**: At this point, User Story 11 should be fully functional. Administrators can import orders from CSV/Excel files with validation and error reporting.

---

## Phase 11: User Story 12 - Manage Customers (Priority: P1 - Phase 2) 🎯 Backoffice

**Goal**: Enable administrators to manage customer accounts with import capabilities

**Independent Test**: Can be tested by creating, updating, and managing customer accounts through the admin interface. Delivers value through centralized customer management.

### Tests for User Story 12

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T413 [P] [US12] Create unit test for Customer aggregate in apps/api/test/unit/backoffice/customer.aggregate.spec.ts
- [ ] T414 [P] [US12] Create unit test for CreateCustomerCommand handler in apps/api/test/unit/backoffice/create-customer.handler.spec.ts
- [ ] T415 [P] [US12] Create unit test for ImportCustomersCommand handler in apps/api/test/unit/backoffice/import-customers.handler.spec.ts
- [ ] T416 [P] [US12] Create integration test for CustomerRepository in apps/api/test/integration/backoffice/customer.repository.spec.ts
- [ ] T417 [P] [US12] Create E2E test for customer management flow in apps/api/test/e2e/customer-management.e2e-spec.ts

### Implementation for User Story 12

#### Domain Layer

- [ ] T418 [P] [US12] Create CustomerAccountStatus value object in apps/api/src/modules/backoffice/domain/value-objects/customer-account-status.ts
- [ ] T419 [US12] Create Customer aggregate root in apps/api/src/modules/backoffice/domain/aggregates/customer.ts
- [ ] T420 [US12] Create CustomerCreated domain event in apps/api/src/modules/backoffice/domain/events/customer-created.ts
- [ ] T421 [US12] Create CustomerUpdated domain event in apps/api/src/modules/backoffice/domain/events/customer-updated.ts
- [ ] T422 [US12] Create CustomerActivated domain event in apps/api/src/modules/backoffice/domain/events/customer-activated.ts
- [ ] T423 [US12] Create CustomerDeactivated domain event in apps/api/src/modules/backoffice/domain/events/customer-deactivated.ts
- [ ] T424 [US12] Create ICustomerRepository interface in apps/api/src/modules/backoffice/domain/repositories/icustomer-repository.ts

#### Application Layer (CQRS)

- [ ] T425 [US12] Create CreateCustomerCommand in apps/api/src/modules/backoffice/application/commands/create-customer.command.ts
- [ ] T426 [US12] Create UpdateCustomerCommand in apps/api/src/modules/backoffice/application/commands/update-customer.command.ts
- [ ] T427 [US12] Create DeleteCustomerCommand in apps/api/src/modules/backoffice/application/commands/delete-customer.command.ts
- [ ] T428 [US12] Create ActivateCustomerCommand in apps/api/src/modules/backoffice/application/commands/activate-customer.command.ts
- [ ] T429 [US12] Create DeactivateCustomerCommand in apps/api/src/modules/backoffice/application/commands/deactivate-customer.command.ts
- [ ] T430 [US12] Create ImportCustomersCommand in apps/api/src/modules/backoffice/application/commands/import-customers.command.ts
- [ ] T431 [US12] Create CreateCustomerCommandHandler in apps/api/src/modules/backoffice/application/handlers/create-customer.handler.ts
- [ ] T432 [US12] Create UpdateCustomerCommandHandler in apps/api/src/modules/backoffice/application/handlers/update-customer.handler.ts
- [ ] T433 [US12] Create DeleteCustomerCommandHandler in apps/api/src/modules/backoffice/application/handlers/delete-customer.handler.ts
- [ ] T434 [US12] Create ActivateCustomerCommandHandler in apps/api/src/modules/backoffice/application/handlers/activate-customer.handler.ts
- [ ] T435 [US12] Create DeactivateCustomerCommandHandler in apps/api/src/modules/backoffice/application/handlers/deactivate-customer.handler.ts
- [ ] T436 [US12] Create ImportCustomersCommandHandler in apps/api/src/modules/backoffice/application/handlers/import-customers.handler.ts
- [ ] T437 [US12] Create CustomerImportService for parsing CSV/Excel files in apps/api/src/modules/backoffice/application/services/customer-import.service.ts
- [ ] T438 [US12] Create CustomerImportValidator for validating imported data in apps/api/src/modules/backoffice/application/services/customer-import-validator.service.ts
- [ ] T439 [US12] Create GetCustomersQuery in apps/api/src/modules/backoffice/application/queries/get-customers.query.ts
- [ ] T440 [US12] Create GetCustomerByIdQuery in apps/api/src/modules/backoffice/application/queries/get-customer-by-id.query.ts
- [ ] T441 [US12] Create GetCustomersQueryHandler in apps/api/src/modules/backoffice/application/handlers/get-customers.handler.ts
- [ ] T442 [US12] Create GetCustomerByIdQueryHandler in apps/api/src/modules/backoffice/application/handlers/get-customer-by-id.handler.ts
- [ ] T443 [US12] Create CustomerDto in apps/api/src/modules/backoffice/application/dtos/customer.dto.ts
- [ ] T444 [US12] Create ImportCustomersDto in apps/api/src/modules/backoffice/application/dtos/import-customers.dto.ts

#### Infrastructure Layer

- [ ] T445 [US12] Create Customer entity (TypeORM) in apps/api/src/modules/backoffice/infrastructure/persistence/entities/customer.entity.ts
- [ ] T446 [US12] Create CustomerRepository implementation in apps/api/src/modules/backoffice/infrastructure/persistence/repositories/customer.repository.ts
- [ ] T447 [US12] Create domain-to-persistence mapper for Customer in apps/api/src/modules/backoffice/infrastructure/persistence/mappers/customer.mapper.ts
- [ ] T448 [US12] Create customer CSV parser service in apps/api/src/modules/backoffice/infrastructure/parsers/customer-csv-parser.service.ts
- [ ] T449 [US12] Create customer Excel parser service in apps/api/src/modules/backoffice/infrastructure/parsers/customer-excel-parser.service.ts
- [ ] T450 [US12] Create Keycloak customer sync service in apps/api/src/modules/backoffice/infrastructure/keycloak/customer-keycloak-sync.service.ts
- [ ] T451 [US12] Create database migration for customers table in apps/api/src/migrations/

#### Presentation Layer

- [ ] T452 [US12] Create CustomerAdminController with CRUD endpoints in apps/api/src/modules/backoffice/presentation/controllers/customer-admin.controller.ts
- [ ] T453 [US12] Create CustomerAdminController with POST /api/admin/customers/import endpoint in apps/api/src/modules/backoffice/presentation/controllers/customer-admin.controller.ts
- [ ] T454 [US12] Create CustomerAdminController with GET /api/admin/customers/:id/orders endpoint in apps/api/src/modules/backoffice/presentation/controllers/customer-admin.controller.ts
- [ ] T455 [US12] Create customer-management.hbs admin page template in apps/api/src/views/pages/admin/customer-management.hbs
- [ ] T456 [US12] Create customer-detail.hbs admin page template in apps/api/src/views/pages/admin/customer-detail.hbs
- [ ] T457 [US12] Create view model builders (presenters) for customer pages in apps/api/src/modules/backoffice/presentation/presenters/customer-admin.presenter.ts

**Checkpoint**: At this point, User Story 12 should be fully functional. Administrators can manage customers, import from CSV/Excel, and view customer order history.

---

## Phase 12: User Story 13 - Change Data Capture (CDC) Integration (Priority: P1 - Phase 2) 🎯 Backoffice

**Goal**: Enable real-time data synchronization with external systems through Change Data Capture (CDC) events

**Independent Test**: Can be tested by making data changes and verifying CDC events are captured and published. Delivers value through real-time data synchronization.

### Tests for User Story 13

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T458 [P] [US13] Create unit test for CDC event capture service in apps/api/test/unit/backoffice/cdc-event-capture.service.spec.ts
- [ ] T459 [P] [US13] Create unit test for CDC event publisher service in apps/api/test/unit/backoffice/cdc-event-publisher.service.spec.ts
- [ ] T460 [P] [US13] Create unit test for CDC configuration service in apps/api/test/unit/backoffice/cdc-configuration.service.spec.ts
- [ ] T461 [P] [US13] Create integration test for CDC event processing in apps/api/test/integration/backoffice/cdc-event-processing.spec.ts
- [ ] T462 [P] [US13] Create E2E test for CDC flow in apps/api/test/e2e/cdc-integration.e2e-spec.ts

### Implementation for User Story 13

#### Domain Layer

- [ ] T463 [P] [US13] Create CDCConfiguration aggregate root in apps/api/src/modules/backoffice/domain/aggregates/cdc-configuration.ts
- [ ] T464 [US13] Create CDCEvent value object in apps/api/src/modules/backoffice/domain/value-objects/cdc-event.ts
- [ ] T465 [US13] Create CDCEventType value object in apps/api/src/modules/backoffice/domain/value-objects/cdc-event-type.ts
- [ ] T466 [US13] Create CDCEventPublished domain event in apps/api/src/modules/backoffice/domain/events/cdc-event-published.ts
- [ ] T467 [US13] Create CDCEventFailed domain event in apps/api/src/modules/backoffice/domain/events/cdc-event-failed.ts
- [ ] T468 [US13] Create ICDCConfigurationRepository interface in apps/api/src/modules/backoffice/domain/repositories/icdc-configuration-repository.ts

#### Application Layer (CQRS)

- [ ] T469 [US13] Create ConfigureCDCCommand in apps/api/src/modules/backoffice/application/commands/configure-cdc.command.ts
- [ ] T470 [US13] Create EnableCDCForEntityCommand in apps/api/src/modules/backoffice/application/commands/enable-cdc-for-entity.command.ts
- [ ] T471 [US13] Create DisableCDCForEntityCommand in apps/api/src/modules/backoffice/application/commands/disable-cdc-for-entity.command.ts
- [ ] T472 [US13] Create ConfigureCDCCommandHandler in apps/api/src/modules/backoffice/application/handlers/configure-cdc.handler.ts
- [ ] T473 [US13] Create EnableCDCForEntityCommandHandler in apps/api/src/modules/backoffice/application/handlers/enable-cdc-for-entity.handler.ts
- [ ] T474 [US13] Create DisableCDCForEntityCommandHandler in apps/api/src/modules/backoffice/application/handlers/disable-cdc-for-entity.handler.ts
- [ ] T475 [US13] Create CDCEventCaptureService for capturing entity changes in apps/api/src/modules/backoffice/application/services/cdc-event-capture.service.ts
- [ ] T476 [US13] Create CDCEventPublisherService for publishing CDC events in apps/api/src/modules/backoffice/application/services/cdc-event-publisher.service.ts
- [ ] T477 [US13] Create CDCEventFilterService for filtering CDC events in apps/api/src/modules/backoffice/application/services/cdc-event-filter.service.ts
- [ ] T478 [US13] Create CDCRetryService for retrying failed CDC events in apps/api/src/modules/backoffice/application/services/cdc-retry.service.ts
- [ ] T479 [US13] Create GetCDCConfigurationQuery in apps/api/src/modules/backoffice/application/queries/get-cdc-configuration.query.ts
- [ ] T480 [US13] Create GetCDCEventsQuery in apps/api/src/modules/backoffice/application/queries/get-cdc-events.query.ts
- [ ] T481 [US13] Create GetCDCStatisticsQuery in apps/api/src/modules/backoffice/application/queries/get-cdc-statistics.query.ts
- [ ] T482 [US13] Create GetCDCConfigurationQueryHandler in apps/api/src/modules/backoffice/application/handlers/get-cdc-configuration.handler.ts
- [ ] T483 [US13] Create GetCDCEventsQueryHandler in apps/api/src/modules/backoffice/application/handlers/get-cdc-events.handler.ts
- [ ] T484 [US13] Create GetCDCStatisticsQueryHandler in apps/api/src/modules/backoffice/application/handlers/get-cdc-statistics.handler.ts
- [ ] T485 [US13] Create CDCConfigurationDto in apps/api/src/modules/backoffice/application/dtos/cdc-configuration.dto.ts
- [ ] T486 [US13] Create CDCEventDto in apps/api/src/modules/backoffice/application/dtos/cdc-event.dto.ts
- [ ] T487 [US13] Create CDCStatisticsDto in apps/api/src/modules/backoffice/application/dtos/cdc-statistics.dto.ts

#### Infrastructure Layer

- [ ] T488 [US13] Create CDCConfiguration entity (TypeORM) in apps/api/src/modules/backoffice/infrastructure/persistence/entities/cdc-configuration.entity.ts
- [ ] T489 [US13] Create CDCEvent entity (TypeORM) in apps/api/src/modules/backoffice/infrastructure/persistence/entities/cdc-event.entity.ts
- [ ] T490 [US13] Create CDCConfigurationRepository implementation in apps/api/src/modules/backoffice/infrastructure/persistence/repositories/cdc-configuration.repository.ts
- [ ] T491 [US13] Create CDCEventRepository implementation in apps/api/src/modules/backoffice/infrastructure/persistence/repositories/cdc-event.repository.ts
- [ ] T492 [US13] Create CDC interceptor for capturing entity changes in apps/api/src/modules/backoffice/infrastructure/interceptors/cdc-interceptor.ts
- [ ] T493 [US13] Create CDC event publisher for RabbitMQ in apps/api/src/modules/backoffice/infrastructure/messaging/cdc-event-publisher.service.ts
- [ ] T494 [US13] Create CDC retry processor with exponential backoff in apps/api/src/modules/backoffice/infrastructure/messaging/cdc-retry-processor.service.ts
- [ ] T495 [US13] Create database migration for cdc_configurations and cdc_events tables in apps/api/src/migrations/
- [ ] T496 [US13] Create CDC event listeners for domain events in apps/api/src/modules/backoffice/infrastructure/events/cdc-event-listeners.ts

#### Presentation Layer

- [ ] T497 [US13] Create CDCAdminController with GET /api/admin/cdc/configuration endpoint in apps/api/src/modules/backoffice/presentation/controllers/cdc-admin.controller.ts
- [ ] T498 [US13] Create CDCAdminController with PUT /api/admin/cdc/configuration endpoint in apps/api/src/modules/backoffice/presentation/controllers/cdc-admin.controller.ts
- [ ] T499 [US13] Create CDCAdminController with POST /api/admin/cdc/entities/:entityType/enable endpoint in apps/api/src/modules/backoffice/presentation/controllers/cdc-admin.controller.ts
- [ ] T500 [US13] Create CDCAdminController with POST /api/admin/cdc/entities/:entityType/disable endpoint in apps/api/src/modules/backoffice/presentation/controllers/cdc-admin.controller.ts
- [ ] T501 [US13] Create CDCAdminController with GET /api/admin/cdc/events endpoint in apps/api/src/modules/backoffice/presentation/controllers/cdc-admin.controller.ts
- [ ] T502 [US13] Create CDCAdminController with GET /api/admin/cdc/statistics endpoint in apps/api/src/modules/backoffice/presentation/controllers/cdc-admin.controller.ts
- [ ] T503 [US13] Create cdc-dashboard.hbs admin page template in apps/api/src/views/pages/admin/cdc-dashboard.hbs
- [ ] T504 [US13] Create view model builders (presenters) for CDC pages in apps/api/src/modules/backoffice/presentation/presenters/cdc-admin.presenter.ts

**Checkpoint**: At this point, User Story 13 should be fully functional. CDC events are captured and published for configured entities, with monitoring and retry capabilities.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 for product data
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Depends on US2 for orders
- **User Story 4 (P1)**: Can start after Foundational (Phase 2) - Independent, can run in parallel with other stories

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Domain layer (value objects, entities, aggregates) before application layer
- Application layer (commands, queries, handlers) before infrastructure layer
- Infrastructure layer (repositories, entities) before presentation layer
- Presentation layer (controllers, views) last
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Domain value objects/entities within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members (US1 and US4 are fully independent)

---

## Parallel Example: User Story 1

```bash
# Launch all value object tests for User Story 1 together:
Task: "Create unit test for SKU value object in apps/api/test/unit/product-catalog/sku.value-object.spec.ts"
Task: "Create unit test for Price value object in apps/api/test/unit/product-catalog/price.value-object.spec.ts"
Task: "Create unit test for Inventory value object in apps/api/test/unit/product-catalog/inventory.value-object.spec.ts"

# Launch all value object implementations for User Story 1 together:
Task: "Create SKU value object in apps/api/src/modules/product-catalog/domain/value-objects/sku.ts"
Task: "Create Price value object in apps/api/src/modules/product-catalog/domain/value-objects/price.ts"
Task: "Create Inventory value object in apps/api/src/modules/product-catalog/domain/value-objects/inventory.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery (Recommended)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Product Catalog)
   - Developer B: User Story 4 (Landing CMS) - fully independent
   - Developer C: User Story 2 (Cart/Checkout) - after US1 complete
   - Developer D: User Story 3 (Order History) - after US2 complete
3. Stories complete and integrate independently

---

## Task Summary

- **Total Tasks**: 504 (296 Phase 1 + 209 Phase 2)
- **Phase 1 (Setup)**: 10 tasks
- **Phase 2 (Foundational)**: 44 tasks
- **Phase 3 (US1 - Browse Products)**: 52 tasks
- **Phase 4 (US2 - Cart/Checkout)**: 69 tasks
- **Phase 5 (US3 - Order History)**: 20 tasks
- **Phase 6 (US4 - Landing CMS)**: 63 tasks
- **Phase 7 (Polish)**: 38 tasks
- **Phase 8 (US9 - Product/Category Management)**: 56 tasks
- **Phase 9 (US10 - Store Management)**: 34 tasks
- **Phase 10 (US11 - Order Import)**: 27 tasks
- **Phase 11 (US12 - Customer Management)**: 45 tasks
- **Phase 12 (US13 - CDC Integration)**: 47 tasks

### Task Count per User Story

**Phase 1 (MVP):**

- **User Story 1**: 52 tasks (browse and search products)
- **User Story 2**: 69 tasks (cart and checkout)
- **User Story 3**: 20 tasks (order history)
- **User Story 4**: 63 tasks (landing page CMS)

**Phase 2 (Backoffice):**

- **User Story 9**: 56 tasks (product and category management)
- **User Story 10**: 34 tasks (store management)
- **User Story 11**: 27 tasks (order import from files)
- **User Story 12**: 45 tasks (customer management)
- **User Story 13**: 47 tasks (CDC integration)

### Parallel Opportunities Identified

- **Phase 1**: 7 parallel tasks
- **Phase 2**: 15+ parallel tasks (within foundational infrastructure)
- **Phase 3**: 10+ parallel tasks (value objects, tests)
- **Phase 4**: 8+ parallel tasks (domain entities, tests)
- **Phase 5**: 5+ parallel tasks (query handlers, tests)
- **Phase 6**: 12+ parallel tasks (value objects, tests)
- **Phase 7**: 20+ parallel tasks (polish items)
- **Phase 8**: 9+ parallel tasks (product management tests)
- **Phase 9**: 5+ parallel tasks (store management tests)
- **Phase 10**: 4+ parallel tasks (order import tests)
- **Phase 11**: 5+ parallel tasks (customer management tests)
- **Phase 12**: 5+ parallel tasks (CDC tests)

### Independent Test Criteria

**Phase 1 (MVP):**

- **User Story 1**: Load product catalog, perform searches, apply filters, verify results
- **User Story 2**: Add products to cart, modify quantities, complete checkout, place order
- **User Story 3**: Place order, view in order history, track status, reorder
- **User Story 4**: Edit landing page sections via CMS, preview, publish, verify on public page

**Phase 2 (Backoffice):**

- **User Story 9**: Create, update, delete products and categories through admin interface, import from CSV/Excel
- **User Story 10**: Create stores, assign inventory to stores, view store-specific data
- **User Story 11**: Upload CSV/Excel files with order data, validate imports, verify orders created correctly
- **User Story 12**: Create, update, manage customer accounts, import from CSV/Excel, view customer order history
- **User Story 13**: Make data changes, verify CDC events captured and published to message broker

### Suggested MVP Scope

- **Minimum MVP**: Phase 1 + Phase 2 + Phase 3 (User Story 1 only)
- **Full MVP (Phase 1)**: Phase 1 + Phase 2 + Phase 3 + Phase 4 + Phase 5 + Phase 6 (All P1 user stories)
- **Full Backoffice (Phase 2)**: Phase 8 + Phase 9 + Phase 10 + Phase 11 + Phase 12 (All backoffice user stories)
- **Recommended**: Start with minimum MVP, then incrementally add remaining stories, then add backoffice features

### Format Validation

✅ All tasks follow the checklist format:

- Checkbox: `- [ ]`
- Task ID: `T001`, `T002`, etc.
- Parallel marker: `[P]` where applicable
- Story label: `[US1]`, `[US2]`, `[US3]`, `[US4]` for user story tasks
- Description with file path: All tasks include exact file paths

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- 90% code coverage is mandatory - all tests must be written and passing
- Clean Architecture must be maintained - domain layer has no infrastructure dependencies
- CQRS pattern must be followed - separate commands and queries
- Event-driven architecture - all domain events must be published via outbox pattern
