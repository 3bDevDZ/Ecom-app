import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Identity Module (for JwtAuthGuard and KeycloakAuthService)
import { IdentityModule } from '../identity/identity.module';

// Infrastructure - Persistence Entities
import { CartItemEntity } from './infrastructure/persistence/entities/cart-item.entity';
import { CartEntity } from './infrastructure/persistence/entities/cart.entity';
import { OrderItemEntity } from './infrastructure/persistence/entities/order-item.entity';
import { OrderEntity } from './infrastructure/persistence/entities/order.entity';

// Infrastructure - Repositories
import { CartRepository } from './infrastructure/persistence/repositories/cart.repository';
import { OrderRepository } from './infrastructure/persistence/repositories/order.repository';

// Presentation - Controllers - API
import { CartController } from './presentation/controllers/cart.controller';
import { OrderController } from './presentation/controllers/order.controller';
// Presentation - Controllers - Views
import { CartViewController } from './presentation/controllers/cart-view.controller';
import { CheckoutViewController } from './presentation/controllers/checkout-view.controller';
import { OrderViewController } from './presentation/controllers/order-view.controller';

// Application - Command Handlers
import { AddToCartCommandHandler } from './application/handlers/add-to-cart.handler';
import { CancelOrderCommandHandler } from './application/handlers/cancel-order.handler';
import { ClearCartCommandHandler } from './application/handlers/clear-cart.handler';
import { PlaceOrderCommandHandler } from './application/handlers/place-order.handler';
import { RemoveFromCartCommandHandler } from './application/handlers/remove-from-cart.handler';
import { ReorderCommandHandler } from './application/handlers/reorder.handler';
import { UpdateCartItemCommandHandler } from './application/handlers/update-cart-item.handler';

// Application - Query Handlers
import { GetCartQueryHandler } from './application/handlers/get-cart.handler';
import { GetOrderByIdQueryHandler } from './application/handlers/get-order-by-id.handler';
import { GetOrderHistoryQueryHandler } from './application/handlers/get-order-history.handler';

// Application - Sagas
import { OrderPlacementSaga } from './application/sagas/order-placement.saga';

// Repository tokens

// Infrastructure - Event Handlers
import { OrderEventHandlers } from './infrastructure/events/order-event.handlers';

// Infrastructure - Email Service
import { OrderEmailService } from './infrastructure/email/order-email.service';

// Presentation - Presenters
import { CartPresenter } from './presentation/presenters/cart.presenter';

// Product Catalog Module (for product lookup during cart operations)
import { ProductCatalogModule } from '../product-catalog/product-catalog.module';

// Shared Infrastructure - Outbox Module (for event publishing)
import { OutboxModule } from '../../shared/infrastructure/outbox/outbox.module';
// Shared Infrastructure - Storage Module (for MinIO)
import { StorageModule } from '../../shared/infrastructure/storage/storage.module';
// Infrastructure - Receipt Service
import { ReceiptService } from './infrastructure/services/receipt.service';

const commandHandlers = [
  AddToCartCommandHandler,
  UpdateCartItemCommandHandler,
  RemoveFromCartCommandHandler,
  ClearCartCommandHandler,
  PlaceOrderCommandHandler,
  CancelOrderCommandHandler,
  ReorderCommandHandler,
];

const queryHandlers = [
  GetCartQueryHandler,
  GetOrderHistoryQueryHandler,
  GetOrderByIdQueryHandler,
];

const sagas = [OrderPlacementSaga];

/**
 * Order Management Module (Bounded Context)
 *
 * Responsibilities:
 * - Shopping cart management (add, update, remove items)
 * - Order placement and processing
 * - Inventory reservation (30-minute timeout)
 * - Order status tracking (Pending → Confirmed → External)
 * - Integration with external OMS via RabbitMQ
 * - Email notifications (order confirmation)
 * - Saga orchestration for complex workflows
 */
@Module({
  imports: [
    CqrsModule,
    IdentityModule, // Required for JwtAuthGuard which needs KeycloakAuthService
    TypeOrmModule.forFeature([
      CartEntity,
      CartItemEntity,
      OrderEntity,
      OrderItemEntity,
    ]),
    ProductCatalogModule, // For product lookup during cart operations
    OutboxModule, // For event publishing via Outbox pattern
    StorageModule, // For file storage (receipts, documents)
  ],
  controllers: [
    // API Controllers (with /api prefix)
    CartController,
    OrderController,
    // View Controllers (without /api prefix, excluded from global prefix)
    CartViewController,
    CheckoutViewController,
    OrderViewController,
  ],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    ...sagas,
    ...OrderEventHandlers,
    // Repository providers
    {
      provide: 'ICartRepository',
      useClass: CartRepository,
    },
    {
      provide: 'IOrderRepository',
      useClass: OrderRepository,
    },
    // Services
    OrderEmailService,
    ReceiptService,
    CartPresenter,
  ],
  exports: ['ICartRepository', 'IOrderRepository', CartPresenter],
})
export class OrderManagementModule { }

