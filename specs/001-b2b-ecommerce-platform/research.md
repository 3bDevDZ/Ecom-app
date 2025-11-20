# Technology Research & Decisions

**Feature**: B2B E-Commerce Platform MVP
**Date**: 2025-11-17
**Status**: Phase 0 Complete

## Overview

This document captures all technology research, decisions, and implementation patterns for the B2B E-Commerce Platform MVP. Each section includes the decision made, rationale, alternatives considered, and concrete implementation examples.

---

## 1. Keycloak Integration with NestJS

### Decision

**Selected Approach**: OAuth 2.0 Authorization Code Flow with PKCE + JWT validation via Keycloak Adapter

**Libraries**:
- `keycloak-connect` (v23.0.0+) - Official Keycloak Node.js adapter
- `@nestjs/passport` + `passport` - NestJS authentication framework
- `passport-jwt` - JWT strategy for token validation

### Rationale

- **Authorization Code Flow with PKCE**: Most secure OAuth 2.0 flow for web applications; prevents authorization code interception
- **Keycloak Adapter**: Official support, handles token refresh, session management automatically
- **JWT Validation**: Stateless authentication; tokens can be validated without contacting Keycloak on every request
- **NestJS Passport Integration**: Idiomatic NestJS pattern; seamless guard integration

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| **Direct OIDC Client** | More boilerplate; Keycloak adapter handles edge cases (token refresh, realm config) |
| **Session-based Auth** | Not stateless; doesn't scale horizontally without sticky sessions |
| **Basic Auth** | Not suitable for web apps; no SSO support |

### Implementation Pattern

**1. Keycloak Configuration** (`config/keycloak.config.ts`):

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('keycloak', () => ({
  realm: process.env.KEYCLOAK_REALM || 'b2b-ecommerce',
  authServerUrl: process.env.KEYCLOAK_URL || 'http://localhost:8080',
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'ecommerce-app',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  publicKey: process.env.KEYCLOAK_PUBLIC_KEY,
  realmPublicKey: process.env.KEYCLOAK_REALM_PUBLIC_KEY,
}));
```

**2. Keycloak Module Setup** (`modules/identity/identity.module.ts`):

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { KeycloakAuthGuard } from './application/guards/keycloak-auth.guard';
import { KeycloakStrategy } from './application/strategies/keycloak.strategy';
import { AuthController } from './presentation/controllers/auth.controller';
import keycloakConfig from '../../config/keycloak.config';

@Module({
  imports: [
    ConfigModule.forFeature(keycloakConfig),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        publicKey: config.get('keycloak.publicKey'),
        verifyOptions: {
          algorithms: ['RS256'],
          issuer: `${config.get('keycloak.authServerUrl')}/realms/${config.get('keycloak.realm')}`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [KeycloakStrategy, KeycloakAuthGuard],
  exports: [KeycloakAuthGuard, PassportModule],
})
export class IdentityModule {}
```

**3. JWT Strategy** (`modules/identity/application/strategies/keycloak.strategy.ts`):

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, ExtractJwt } from 'passport-jwt';

export interface JwtPayload {
  sub: string; // User ID from Keycloak
  email: string;
  preferred_username: string;
  realm_access?: { roles: string[] };
  resource_access?: Record<string, { roles: string[] }>;
}

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('keycloak.publicKey'),
      algorithms: ['RS256'],
      issuer: `${configService.get('keycloak.authServerUrl')}/realms/${configService.get('keycloak.realm')}`,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token: missing subject');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      username: payload.preferred_username,
    };
  }
}
```

**4. Auth Guard** (`modules/identity/application/guards/keycloak-auth.guard.ts`):

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class KeycloakAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Add custom logic if needed (e.g., checking user status)
    return super.canActivate(context);
  }
}
```

**5. Usage in Controllers**:

```typescript
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { KeycloakAuthGuard } from '../../identity/application/guards/keycloak-auth.guard';

@Controller('orders')
export class OrderController {
  @Get()
  @UseGuards(KeycloakAuthGuard)
  async getOrders(@Req() req) {
    const user = req.user; // { userId, email, username }
    // ... fetch orders for user
  }
}
```

**6. View Protection** (Handlebars middleware):

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies['access_token']; // or from session

    if (token) {
      try {
        const decoded = this.jwtService.verify(token);
        req['user'] = decoded;
        res.locals.user = decoded; // Available in HBS templates
      } catch (err) {
        // Token invalid - redirect to login
        return res.redirect('/login');
      }
    }

    next();
  }
}
```

### Testing Approach

**Unit Tests** (Strategy validation):
```typescript
describe('KeycloakStrategy', () => {
  it('should validate JWT payload and extract user', async () => {
    const strategy = new KeycloakStrategy(configService);
    const payload: JwtPayload = {
      sub: 'user-123',
      email: 'user@example.com',
      preferred_username: 'user123',
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      userId: 'user-123',
      email: 'user@example.com',
      username: 'user123',
    });
  });
});
```

**Integration Tests** (Guard behavior):
```typescript
describe('KeycloakAuthGuard', () => {
  it('should allow access with valid JWT', async () => {
    const token = generateValidJwt();

    const response = await request(app.getHttpServer())
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('should deny access without JWT', async () => {
    await request(app.getHttpServer())
      .get('/api/orders')
      .expect(401);
  });
});
```

### Performance Considerations

- **Token Caching**: JWT validation is fast (signature verification); no need for caching
- **Public Key Rotation**: Fetch Keycloak public key on startup; refresh every 24h via cron
- **Session vs Stateless**: Use JWT for API; optional session for HBS views (better UX)

---

## 2. CQRS Implementation in NestJS

### Decision

**Selected Approach**: `@nestjs/cqrs` library with separate Command/Query handlers and Event Bus

**Library**: `@nestjs/cqrs` (v10.0.0+)

### Rationale

- **Official NestJS Support**: First-party library, well-maintained, idiomatic patterns
- **Command/Query Separation**: Enforces read/write separation at code level; improves testability
- **Event Bus**: Built-in support for domain events; integrates with Sagas for complex workflows
- **Dependency Injection**: Full DI support for handlers; easy mocking in tests

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| **Custom CQRS** | Reinventing wheel; @nestjs/cqrs is mature and well-tested |
| **MediatR (C# port)** | Not TypeScript native; extra abstraction layer |
| **Event Sourcing Frameworks** | Overkill for MVP; adds complexity we don't need |

### Implementation Pattern

**1. Module Setup** (any bounded context):

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Commands
import { PlaceOrderHandler } from './application/commands/place-order.handler';
import { CancelOrderHandler } from './application/commands/cancel-order.handler';

// Queries
import { GetOrderHistoryHandler } from './application/queries/get-order-history.handler';
import { GetOrderByIdHandler } from './application/queries/get-order-by-id.handler';

// Event Handlers
import { OrderPlacedHandler } from './application/events/order-placed.handler';

// Infrastructure
import { OrderRepository } from './infrastructure/persistence/order.repository';
import { OrderEntity } from './infrastructure/persistence/order.entity';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([OrderEntity]),
  ],
  providers: [
    // Command Handlers
    PlaceOrderHandler,
    CancelOrderHandler,

    // Query Handlers
    GetOrderHistoryHandler,
    GetOrderByIdHandler,

    // Event Handlers
    OrderPlacedHandler,

    // Repositories
    OrderRepository,
  ],
})
export class OrderManagementModule {}
```

**2. Command Definition** (`application/commands/place-order.command.ts`):

```typescript
export class PlaceOrderCommand {
  constructor(
    public readonly userId: string,
    public readonly items: Array<{ productId: string; variantId?: string; quantity: number }>,
    public readonly shippingAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    },
    public readonly notes?: string,
    public readonly poNumber?: string,
  ) {}
}
```

**3. Command Handler** (`application/commands/place-order.handler.ts`):

```typescript
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { PlaceOrderCommand } from './place-order.command';
import { OrderRepository } from '../../infrastructure/persistence/order.repository';
import { Order } from '../../domain/aggregates/order.aggregate';
import { OrderPlacedEvent } from '../../domain/events/order-placed.event';

@CommandHandler(PlaceOrderCommand)
export class PlaceOrderHandler implements ICommandHandler<PlaceOrderCommand> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: PlaceOrderCommand): Promise<{ orderId: string; orderNumber: string }> {
    // 1. Create Order aggregate (domain logic)
    const order = Order.create({
      userId: command.userId,
      items: command.items,
      shippingAddress: command.shippingAddress,
      notes: command.notes,
      poNumber: command.poNumber,
    });

    // 2. Persist order
    const savedOrder = await this.orderRepository.save(order);

    // 3. Publish domain events
    const events = savedOrder.getUncommittedEvents();
    events.forEach(event => this.eventBus.publish(event));
    savedOrder.commit(); // Clear uncommitted events

    return {
      orderId: savedOrder.id,
      orderNumber: savedOrder.orderNumber.value,
    };
  }
}
```

**4. Query Definition** (`application/queries/get-order-history.query.ts`):

```typescript
export class GetOrderHistoryQuery {
  constructor(
    public readonly userId: string,
    public readonly filters?: {
      status?: string;
      fromDate?: Date;
      toDate?: Date;
    },
    public readonly pagination?: {
      page: number;
      limit: number;
    },
  ) {}
}
```

**5. Query Handler** (`application/queries/get-order-history.handler.ts`):

```typescript
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetOrderHistoryQuery } from './get-order-history.query';
import { OrderReadModelRepository } from '../../infrastructure/persistence/order-read-model.repository';

export interface OrderHistoryItem {
  orderId: string;
  orderNumber: string;
  placedAt: Date;
  status: string;
  total: number;
  itemCount: number;
}

@QueryHandler(GetOrderHistoryQuery)
export class GetOrderHistoryHandler implements IQueryHandler<GetOrderHistoryQuery> {
  constructor(
    private readonly readModelRepository: OrderReadModelRepository,
  ) {}

  async execute(query: GetOrderHistoryQuery): Promise<{
    items: OrderHistoryItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { userId, filters, pagination } = query;

    // Query optimized read model (denormalized for fast reads)
    const [items, total] = await this.readModelRepository.findByUser(
      userId,
      filters,
      pagination,
    );

    return {
      items,
      total,
      page: pagination?.page || 1,
      limit: pagination?.limit || 20,
    };
  }
}
```

**6. Domain Event** (`domain/events/order-placed.event.ts`):

```typescript
import { IEvent } from '@nestjs/cqrs';

export class OrderPlacedEvent implements IEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly orderNumber: string,
    public readonly total: number,
    public readonly items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
    }>,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

**7. Event Handler** (`application/events/order-placed.handler.ts`):

```typescript
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { OrderPlacedEvent } from '../../domain/events/order-placed.event';
import { OutboxService } from '../../../shared/infrastructure/outbox/outbox.service';
import { EmailService } from '../../infrastructure/email/email.service';

@EventsHandler(OrderPlacedEvent)
export class OrderPlacedHandler implements IEventHandler<OrderPlacedEvent> {
  constructor(
    private readonly outboxService: OutboxService,
    private readonly emailService: EmailService,
  ) {}

  async handle(event: OrderPlacedEvent) {
    // 1. Store in outbox for guaranteed delivery to RabbitMQ
    await this.outboxService.saveEvent({
      eventType: 'order.placed',
      aggregateId: event.orderId,
      payload: event,
    });

    // 2. Send confirmation email (fire and forget)
    await this.emailService.sendOrderConfirmation(event.userId, event.orderId);
  }
}
```

**8. Controller Usage** (`presentation/controllers/order.controller.ts`):

```typescript
import { Controller, Post, Body, UseGuards, Req, Get, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PlaceOrderCommand } from '../../application/commands/place-order.command';
import { GetOrderHistoryQuery } from '../../application/queries/get-order-history.query';
import { KeycloakAuthGuard } from '../../../identity/application/guards/keycloak-auth.guard';
import { PlaceOrderDto } from '../dtos/place-order.dto';
import { OrderHistoryFilterDto } from '../dtos/order-history-filter.dto';

@Controller('api/orders')
@UseGuards(KeycloakAuthGuard)
export class OrderController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async placeOrder(@Req() req, @Body() dto: PlaceOrderDto) {
    const command = new PlaceOrderCommand(
      req.user.userId,
      dto.items,
      dto.shippingAddress,
      dto.notes,
      dto.poNumber,
    );

    return await this.commandBus.execute(command);
  }

  @Get()
  async getOrderHistory(@Req() req, @Query() filters: OrderHistoryFilterDto) {
    const query = new GetOrderHistoryQuery(
      req.user.userId,
      {
        status: filters.status,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      },
      {
        page: filters.page || 1,
        limit: filters.limit || 20,
      },
    );

    return await this.queryBus.execute(query);
  }
}
```

### Read Model Synchronization

**Eventual Consistency Approach**: Update read models via event handlers

```typescript
@EventsHandler(OrderPlacedEvent)
export class UpdateOrderReadModelHandler implements IEventHandler<OrderPlacedEvent> {
  constructor(
    private readonly readModelRepository: OrderReadModelRepository,
  ) {}

  async handle(event: OrderPlacedEvent) {
    // Project domain event into optimized read model
    await this.readModelRepository.create({
      orderId: event.orderId,
      userId: event.userId,
      orderNumber: event.orderNumber,
      placedAt: event.occurredAt,
      status: 'pending',
      total: event.total,
      itemCount: event.items.length,
    });
  }
}
```

### Testing Approach

**Unit Tests** (Command Handler):
```typescript
describe('PlaceOrderHandler', () => {
  let handler: PlaceOrderHandler;
  let orderRepository: jest.Mocked<OrderRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    orderRepository = createMock<OrderRepository>();
    eventBus = createMock<EventBus>();
    handler = new PlaceOrderHandler(orderRepository, eventBus);
  });

  it('should place order and publish OrderPlacedEvent', async () => {
    const command = new PlaceOrderCommand(/* ... */);
    orderRepository.save.mockResolvedValue(mockOrder);

    const result = await handler.execute(command);

    expect(orderRepository.save).toHaveBeenCalledWith(expect.any(Order));
    expect(eventBus.publish).toHaveBeenCalledWith(expect.any(OrderPlacedEvent));
    expect(result.orderId).toBeDefined();
  });
});
```

**Integration Tests** (Full CQRS flow):
```typescript
describe('Order CQRS Integration', () => {
  it('should handle command and query roundtrip', async () => {
    // Execute command
    const { orderId } = await commandBus.execute(new PlaceOrderCommand(/* ... */));

    // Wait for event handling (eventual consistency)
    await waitForEventProcessing();

    // Execute query
    const result = await queryBus.execute(new GetOrderHistoryQuery(userId));

    expect(result.items).toContainEqual(expect.objectContaining({ orderId }));
  });
});
```

### Performance Considerations

- **Read Models**: Denormalized for fast queries; indexed appropriately
- **Command Validation**: Validate in controller (DTO); keep handlers focused on business logic
- **Event Bus**: In-memory for same process; RabbitMQ for cross-service (via outbox)

---

## 3. Outbox Pattern Implementation

### Decision

**Selected Approach**: Polling-based outbox pattern with TypeORM and RabbitMQ

**Components**:
- Outbox table (PostgreSQL)
- Scheduled polling service (NestJS cron)
- RabbitMQ publisher
- Retry mechanism with exponential backoff

### Rationale

- **Guaranteed Delivery**: Events persisted in same transaction as business data; no dual-write problem
- **Eventual Consistency**: RabbitMQ consumers eventually receive all events
- **Polling vs CDC**: Simpler to implement than Change Data Capture; sufficient for MVP scale
- **Idempotency**: Events have unique IDs; consumers can deduplicate

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| **Direct RabbitMQ Publish** | Dual-write problem; event loss if commit succeeds but publish fails |
| **CDC (Debezium)** | More complex infrastructure; overkill for MVP scale |
| **Transaction Log Tailing** | Database-specific; tight coupling to PostgreSQL internals |

### Implementation Pattern

**1. Outbox Entity** (`shared/infrastructure/outbox/outbox.entity.ts`):

```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('outbox_events')
@Index(['processed', 'createdAt']) // Optimize polling query
export class OutboxEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  eventType: string; // e.g., 'order.placed', 'inventory.reserved'

  @Column({ type: 'uuid' })
  aggregateId: string; // ID of aggregate that produced event

  @Column({ type: 'jsonb' })
  payload: any; // Event data

  @Column({ type: 'boolean', default: false })
  processed: boolean;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  error: string | null; // Last error message if processing failed

  @CreateDateColumn()
  createdAt: Date;
}
```

**2. Outbox Service** (`shared/infrastructure/outbox/outbox.service.ts`):

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OutboxEventEntity } from './outbox.entity';

export interface OutboxEvent {
  eventType: string;
  aggregateId: string;
  payload: any;
}

@Injectable()
export class OutboxService {
  constructor(
    @InjectRepository(OutboxEventEntity)
    private readonly outboxRepository: Repository<OutboxEventEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Save event to outbox within existing transaction
   * MUST be called within the same transaction as aggregate persistence
   */
  async saveEvent(event: OutboxEvent, queryRunner?: any): Promise<void> {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(OutboxEventEntity)
      : this.outboxRepository;

    await repo.save({
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      payload: event.payload,
      processed: false,
      retryCount: 0,
    });
  }

  /**
   * Fetch unprocessed events for polling
   */
  async getUnprocessedEvents(limit: number = 100): Promise<OutboxEventEntity[]> {
    return await this.outboxRepository.find({
      where: { processed: false },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  /**
   * Mark event as processed after successful publish
   */
  async markAsProcessed(eventId: string): Promise<void> {
    await this.outboxRepository.update(eventId, {
      processed: true,
      processedAt: new Date(),
    });
  }

  /**
   * Record processing error and increment retry count
   */
  async recordError(eventId: string, error: string): Promise<void> {
    await this.outboxRepository.increment({ id: eventId }, 'retryCount', 1);
    await this.outboxRepository.update(eventId, { error });
  }
}
```

**3. Outbox Processor** (`shared/infrastructure/outbox/outbox.processor.ts`):

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxService } from './outbox.service';
import { MessageBrokerService } from '../messaging/message-broker.service';

@Injectable()
export class OutboxProcessor {
  private readonly logger = new Logger(OutboxProcessor.name);
  private readonly MAX_RETRIES = 5;

  constructor(
    private readonly outboxService: OutboxService,
    private readonly messageBroker: MessageBrokerService,
  ) {}

  /**
   * Poll outbox every 5 seconds and publish events to RabbitMQ
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutbox() {
    const events = await this.outboxService.getUnprocessedEvents(100);

    if (events.length === 0) {
      return; // No events to process
    }

    this.logger.log(`Processing ${events.length} outbox events`);

    for (const event of events) {
      try {
        // Skip if exceeded max retries
        if (event.retryCount >= this.MAX_RETRIES) {
          this.logger.error(
            `Event ${event.id} exceeded max retries (${this.MAX_RETRIES}). Moving to dead letter.`,
          );
          // TODO: Move to dead letter table for manual intervention
          await this.outboxService.markAsProcessed(event.id);
          continue;
        }

        // Publish to RabbitMQ
        await this.messageBroker.publish(event.eventType, {
          eventId: event.id,
          eventType: event.eventType,
          aggregateId: event.aggregateId,
          payload: event.payload,
          occurredAt: event.createdAt,
        });

        // Mark as processed
        await this.outboxService.markAsProcessed(event.id);
        this.logger.debug(`Successfully published event ${event.id} (${event.eventType})`);

      } catch (error) {
        this.logger.error(`Failed to publish event ${event.id}: ${error.message}`);

        // Record error and increment retry count
        await this.outboxService.recordError(event.id, error.message);

        // Exponential backoff: wait before next retry
        // Handled by cron - failed events will be retried on next poll
      }
    }
  }
}
```

**4. Message Broker Service** (`shared/infrastructure/messaging/message-broker.service.ts`):

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class MessageBrokerService implements OnModuleInit {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly exchangeName = 'domain-events';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL');
    this.connection = await amqp.connect(rabbitmqUrl);
    this.channel = await this.connection.createChannel();

    // Declare exchange
    await this.channel.assertExchange(this.exchangeName, 'topic', {
      durable: true,
    });
  }

  async publish(routingKey: string, message: any): Promise<void> {
    const buffer = Buffer.from(JSON.stringify(message));

    this.channel.publish(
      this.exchangeName,
      routingKey, // e.g., 'order.placed', 'inventory.reserved'
      buffer,
      {
        persistent: true, // Survive broker restart
        messageId: message.eventId,
        timestamp: Date.now(),
      },
    );
  }

  async onModuleDestroy() {
    await this.channel.close();
    await this.connection.close();
  }
}
```

**5. Usage in Command Handler** (with transaction):

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { OutboxService } from '../../../shared/infrastructure/outbox/outbox.service';
import { OrderRepository } from '../../infrastructure/persistence/order.repository';

@CommandHandler(PlaceOrderCommand)
export class PlaceOrderHandler implements ICommandHandler<PlaceOrderCommand> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly outboxService: OutboxService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(command: PlaceOrderCommand): Promise<{ orderId: string }> {
    // Start transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create and save order (write model)
      const order = Order.create(command);
      const savedOrder = await this.orderRepository.save(order, queryRunner);

      // 2. Save domain events to outbox (same transaction!)
      for (const event of savedOrder.getUncommittedEvents()) {
        await this.outboxService.saveEvent(
          {
            eventType: event.constructor.name.toLowerCase().replace('event', ''),
            aggregateId: savedOrder.id,
            payload: event,
          },
          queryRunner,
        );
      }

      // 3. Commit transaction (order + outbox events atomically saved)
      await queryRunner.commitTransaction();
      savedOrder.commit(); // Clear uncommitted events

      return { orderId: savedOrder.id };

    } catch (error) {
      // Rollback on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

### Monitoring & Observability

**Metrics to Track**:
- Outbox table size (unprocessed events)
- Event processing lag (time between creation and processing)
- Retry count distribution
- Failed events (exceeded max retries)

**Health Check**:
```typescript
@Injectable()
export class OutboxHealthIndicator extends HealthIndicator {
  constructor(private readonly outboxService: OutboxService) {
    super();
  }

  async check(key: string): Promise<HealthIndicatorResult> {
    const unprocessedCount = await this.outboxService.countUnprocessed();
    const isHealthy = unprocessedCount < 1000; // Threshold

    return this.getStatus(key, isHealthy, { unprocessedCount });
  }
}
```

### Testing Approach

**Integration Tests** (Outbox workflow):
```typescript
describe('Outbox Pattern Integration', () => {
  it('should save order and events in same transaction', async () => {
    // Execute command
    const { orderId } = await commandBus.execute(new PlaceOrderCommand(/* ... */));

    // Verify order saved
    const order = await orderRepository.findById(orderId);
    expect(order).toBeDefined();

    // Verify events in outbox
    const outboxEvents = await outboxRepository.find({
      where: { aggregateId: orderId },
    });
    expect(outboxEvents.length).toBeGreaterThan(0);
  });

  it('should publish events from outbox to RabbitMQ', async () => {
    // Create outbox event
    await outboxService.saveEvent({
      eventType: 'order.placed',
      aggregateId: 'order-123',
      payload: { /* ... */ },
    });

    // Run processor
    await outboxProcessor.processOutbox();

    // Verify event published
    const event = await outboxRepository.findOne({ where: { aggregateId: 'order-123' } });
    expect(event.processed).toBe(true);
  });
});
```

### Performance Considerations

- **Batch Processing**: Poll 100 events at a time; balance throughput vs latency
- **Indexing**: Index `(processed, createdAt)` for fast polling queries
- **Cleanup**: Archive processed events after 30 days (separate cron job)
- **Dead Letter**: Move failed events (max retries exceeded) to separate table

---

## 4. Event-Driven Architecture

### Decision

**Selected Approach**: Domain events within aggregates + Integration events via RabbitMQ

**Pattern**:
1. Domain events raised by aggregates (in-memory)
2. Event handlers transform to integration events
3. Integration events stored in outbox
4. Outbox processor publishes to RabbitMQ

### Rationale

- **Domain Events**: Capture business-significant occurrences; decouple domain logic
- **Integration Events**: External systems subscribe to business events
- **Event Versioning**: Schema evolution via version field; backward compatibility
- **Saga Pattern**: Coordinate distributed transactions (e.g., order + inventory reservation)

### Implementation Pattern

**1. Base Domain Event** (`shared/domain/domain-event.ts`):

```typescript
export abstract class DomainEvent {
  public readonly occurredAt: Date;

  constructor() {
    this.occurredAt = new Date();
  }
}
```

**2. Specific Domain Event** (`modules/order-management/domain/events/order-placed.event.ts`):

```typescript
import { DomainEvent } from '../../../../shared/domain/domain-event';

export class OrderPlacedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly orderNumber: string,
    public readonly items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
    }>,
    public readonly total: number,
  ) {
    super();
  }
}
```

**3. Aggregate with Events** (`modules/order-management/domain/aggregates/order.aggregate.ts`):

```typescript
import { AggregateRoot } from '@nestjs/cqrs';
import { OrderPlacedEvent } from '../events/order-placed.event';
import { OrderCancelledEvent } from '../events/order-cancelled.event';

export class Order extends AggregateRoot {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly orderNumber: OrderNumber,
    public readonly items: OrderItem[],
    private _status: OrderStatus,
    // ... other fields
  ) {
    super();
  }

  static create(data: CreateOrderData): Order {
    const order = new Order(
      generateId(),
      data.userId,
      OrderNumber.generate(),
      data.items.map(i => OrderItem.create(i)),
      OrderStatus.Pending,
    );

    // Raise domain event
    order.apply(new OrderPlacedEvent(
      order.id,
      order.userId,
      order.orderNumber.value,
      data.items,
      order.calculateTotal(),
    ));

    return order;
  }

  cancel(): void {
    if (!this.canBeCancelled()) {
      throw new Error('Order cannot be cancelled in current status');
    }

    this._status = OrderStatus.Cancelled;

    // Raise domain event
    this.apply(new OrderCancelledEvent(this.id, this.userId));
  }

  private canBeCancelled(): boolean {
    return this._status === OrderStatus.Pending;
  }
}
```

**4. Integration Event Schema** (`contracts/events/integration/order-placed.integration-event.ts`):

```typescript
export interface OrderPlacedIntegrationEvent {
  eventId: string;
  eventType: 'order.placed';
  version: '1.0';
  occurredAt: string; // ISO 8601
  payload: {
    orderId: string;
    userId: string;
    orderNumber: string;
    items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
    }>;
    total: number;
  };
}
```

**5. Domain → Integration Event Mapper** (`modules/order-management/application/events/order-placed.handler.ts`):

```typescript
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { OrderPlacedEvent } from '../../domain/events/order-placed.event';
import { OutboxService } from '../../../shared/infrastructure/outbox/outbox.service';
import { OrderPlacedIntegrationEvent } from '../../../../contracts/events/integration/order-placed.integration-event';

@EventsHandler(OrderPlacedEvent)
export class OrderPlacedHandler implements IEventHandler<OrderPlacedEvent> {
  constructor(private readonly outboxService: OutboxService) {}

  async handle(event: OrderPlacedEvent) {
    // Transform domain event to integration event
    const integrationEvent: OrderPlacedIntegrationEvent = {
      eventId: generateId(),
      eventType: 'order.placed',
      version: '1.0',
      occurredAt: event.occurredAt.toISOString(),
      payload: {
        orderId: event.orderId,
        userId: event.userId,
        orderNumber: event.orderNumber,
        items: event.items,
        total: event.total,
      },
    };

    // Save to outbox for guaranteed delivery
    await this.outboxService.saveEvent({
      eventType: 'order.placed',
      aggregateId: event.orderId,
      payload: integrationEvent,
    });
  }
}
```

**6. Saga for Distributed Transaction** (`modules/order-management/application/sagas/order-placement.saga.ts`):

```typescript
import { Injectable } from '@nestjs/common';
import { ICommand, ofType, Saga } from '@nestjs/cqrs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OrderPlacedEvent } from '../../domain/events/order-placed.event';
import { ReserveInventoryCommand } from '../../../product-catalog/application/commands/reserve-inventory.command';

@Injectable()
export class OrderPlacementSaga {
  @Saga()
  orderPlaced = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(OrderPlacedEvent),
      map(event => {
        // When order placed, reserve inventory for all items
        return new ReserveInventoryCommand(
          event.orderId,
          event.items,
        );
      }),
    );
  };
}
```

### Event Versioning Strategy

**Approach**: Version field in event schema + backward compatibility

```typescript
// Version 1.0
export interface ProductCreatedV1 {
  eventId: string;
  eventType: 'product.created';
  version: '1.0';
  payload: {
    productId: string;
    name: string;
    price: number;
  };
}

// Version 2.0 (added category field)
export interface ProductCreatedV2 {
  eventId: string;
  eventType: 'product.created';
  version: '2.0';
  payload: {
    productId: string;
    name: string;
    price: number;
    category: string; // NEW FIELD
  };
}

// Consumer handles multiple versions
class ProductCreatedConsumer {
  async handle(event: ProductCreatedV1 | ProductCreatedV2) {
    if (event.version === '1.0') {
      // Handle v1 (no category)
      const category = 'Uncategorized'; // Default
      // ...
    } else if (event.version === '2.0') {
      // Handle v2 (has category)
      const category = event.payload.category;
      // ...
    }
  }
}
```

### Testing Approach

**Unit Tests** (Domain events):
```typescript
describe('Order Aggregate', () => {
  it('should raise OrderPlacedEvent when created', () => {
    const order = Order.create(orderData);

    const events = order.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(OrderPlacedEvent);
  });
});
```

**Integration Tests** (Event flow):
```typescript
describe('Event-Driven Flow', () => {
  it('should publish integration event to RabbitMQ when order placed', async () => {
    // Subscribe to RabbitMQ
    const receivedEvents = [];
    await subscribeToRabbitMQ('order.placed', (event) => {
      receivedEvents.push(event);
    });

    // Place order
    await commandBus.execute(new PlaceOrderCommand(/* ... */));

    // Wait for event processing
    await waitFor(() => receivedEvents.length > 0);

    // Verify integration event
    expect(receivedEvents[0]).toMatchObject({
      eventType: 'order.placed',
      version: '1.0',
    });
  });
});
```

---

## 5. Clean Architecture in NestJS

### Decision

**Selected Structure**: Modules organized by bounded context, each with 4 layers

**Layers** (dependency rule: outer → inner):
1. **Presentation** (Controllers, Views, Presenters)
2. **Application** (Commands, Queries, Handlers, DTOs)
3. **Domain** (Aggregates, Entities, Value Objects, Events, Repository Interfaces)
4. **Infrastructure** (Repositories, External Services, Persistence)

### Rationale

- **Testability**: Domain logic isolated from infrastructure; 95% coverage achievable
- **Maintainability**: Clear separation of concerns; changes localized to specific layers
- **DDD Alignment**: Domain layer contains pure business logic; no framework dependencies
- **Flexibility**: Infrastructure can be swapped (e.g., PostgreSQL → MongoDB) without touching domain

### Implementation Pattern

**1. Domain Layer** (pure TypeScript, no NestJS):

```typescript
// domain/aggregates/product.aggregate.ts
import { AggregateRoot } from '@nestjs/cqrs';
import { SKU } from '../value-objects/sku.vo';
import { Price } from '../value-objects/price.vo';
import { Inventory } from '../value-objects/inventory.vo';
import { ProductCreatedEvent } from '../events/product-created.event';

export class Product extends AggregateRoot {
  private constructor(
    public readonly id: string,
    private _sku: SKU,
    private _name: string,
    private _price: Price,
    private _inventory: Inventory,
  ) {
    super();
  }

  static create(data: {
    sku: string;
    name: string;
    price: number;
    initialInventory: number;
  }): Product {
    const product = new Product(
      generateId(),
      SKU.create(data.sku),
      data.name,
      Price.create(data.price),
      Inventory.create(data.initialInventory),
    );

    product.apply(new ProductCreatedEvent(product.id, data.sku, data.name));
    return product;
  }

  reserveInventory(quantity: number): void {
    this._inventory = this._inventory.reserve(quantity);
    // Raise InventoryReservedEvent...
  }

  // Getters (no setters - encapsulation!)
  get sku(): SKU { return this._sku; }
  get name(): string { return this._name; }
  get price(): Price { return this._price; }
  get inventory(): Inventory { return this._inventory; }
}

// domain/value-objects/sku.vo.ts
export class SKU {
  private constructor(private readonly value: string) {
    this.validate();
  }

  static create(value: string): SKU {
    return new SKU(value);
  }

  private validate(): void {
    if (!/^[A-Z]{3}-\d{4}-[A-Z]{3}$/.test(this.value)) {
      throw new Error('Invalid SKU format');
    }
  }

  equals(other: SKU): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

// domain/repositories/product.repository.interface.ts
export interface IProductRepository {
  save(product: Product): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findBySku(sku: SKU): Promise<Product | null>;
  findAll(filters?: ProductFilters): Promise<Product[]>;
}
```

**2. Application Layer** (CQRS handlers, no infrastructure):

```typescript
// application/commands/create-product.command.ts
export class CreateProductCommand {
  constructor(
    public readonly sku: string,
    public readonly name: string,
    public readonly price: number,
    public readonly initialInventory: number,
  ) {}
}

// application/commands/create-product.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateProductCommand } from './create-product.command';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/aggregates/product.aggregate';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(command: CreateProductCommand): Promise<{ productId: string }> {
    // Domain logic (pure)
    const product = Product.create({
      sku: command.sku,
      name: command.name,
      price: command.price,
      initialInventory: command.initialInventory,
    });

    // Persist via repository (infrastructure abstraction)
    await this.productRepository.save(product);

    return { productId: product.id };
  }
}
```

**3. Infrastructure Layer** (implements domain interfaces):

```typescript
// infrastructure/persistence/product.entity.ts (TypeORM)
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('products')
export class ProductEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  sku: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('int')
  availableInventory: number;

  @Column('int', { default: 0 })
  reservedInventory: number;
}

// infrastructure/persistence/product.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/aggregates/product.aggregate';
import { ProductEntity } from './product.entity';
import { ProductMapper } from './product.mapper';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repository: Repository<ProductEntity>,
  ) {}

  async save(product: Product): Promise<Product> {
    const entity = ProductMapper.toEntity(product);
    const saved = await this.repository.save(entity);
    return ProductMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Product | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? ProductMapper.toDomain(entity) : null;
  }

  async findBySku(sku: SKU): Promise<Product | null> {
    const entity = await this.repository.findOne({ where: { sku: sku.toString() } });
    return entity ? ProductMapper.toDomain(entity) : null;
  }

  async findAll(filters?: ProductFilters): Promise<Product[]> {
    // Build query with filters...
    const entities = await this.repository.find();
    return entities.map(ProductMapper.toDomain);
  }
}

// infrastructure/persistence/product.mapper.ts
export class ProductMapper {
  static toDomain(entity: ProductEntity): Product {
    // Reconstruct domain object from persistence
    return Product.reconstitute({
      id: entity.id,
      sku: entity.sku,
      name: entity.name,
      price: entity.price,
      inventory: {
        available: entity.availableInventory,
        reserved: entity.reservedInventory,
      },
    });
  }

  static toEntity(product: Product): ProductEntity {
    const entity = new ProductEntity();
    entity.id = product.id;
    entity.sku = product.sku.toString();
    entity.name = product.name;
    entity.price = product.price.value;
    entity.availableInventory = product.inventory.available;
    entity.reservedInventory = product.inventory.reserved;
    return entity;
  }
}
```

**4. Presentation Layer** (controllers, views):

```typescript
// presentation/controllers/product.controller.ts
import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateProductCommand } from '../../application/commands/create-product.command';
import { GetProductByIdQuery } from '../../application/queries/get-product-by-id.query';
import { CreateProductDto } from '../dtos/create-product.dto';
import { KeycloakAuthGuard } from '../../../identity/application/guards/keycloak-auth.guard';

@Controller('api/products')
export class ProductController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @UseGuards(KeycloakAuthGuard) // Admin only
  async createProduct(@Body() dto: CreateProductDto) {
    const command = new CreateProductCommand(
      dto.sku,
      dto.name,
      dto.price,
      dto.initialInventory,
    );
    return await this.commandBus.execute(command);
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    const query = new GetProductByIdQuery(id);
    return await this.queryBus.execute(query);
  }
}

// presentation/presenters/product.presenter.ts (for HBS views)
export class ProductPresenter {
  static toViewModel(product: Product): ProductViewModel {
    return {
      id: product.id,
      sku: product.sku.toString(),
      name: product.name,
      price: product.price.formatted(), // $19.99
      inStock: product.inventory.available > 0,
      stockLevel: product.inventory.available,
    };
  }
}
```

**5. Module Wiring** (dependency injection):

```typescript
// product-catalog.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './presentation/controllers/product.controller';
import { CreateProductHandler } from './application/commands/create-product.handler';
import { GetProductByIdHandler } from './application/queries/get-product-by-id.handler';
import { ProductRepository } from './infrastructure/persistence/product.repository';
import { ProductEntity } from './infrastructure/persistence/product.entity';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([ProductEntity]),
  ],
  controllers: [ProductController],
  providers: [
    // Command Handlers
    CreateProductHandler,

    // Query Handlers
    GetProductByIdHandler,

    // Repositories (bind interface to implementation)
    {
      provide: 'IProductRepository',
      useClass: ProductRepository,
    },
  ],
})
export class ProductCatalogModule {}
```

### Dependency Rule Enforcement

**ESLint Plugin** (`eslint-plugin-boundaries`):

```json
// .eslintrc.json
{
  "plugins": ["boundaries"],
  "rules": {
    "boundaries/element-types": [
      "error",
      {
        "default": "disallow",
        "rules": [
          {
            "from": "presentation",
            "allow": ["application", "domain"]
          },
          {
            "from": "application",
            "allow": ["domain"]
          },
          {
            "from": "infrastructure",
            "allow": ["application", "domain"]
          },
          {
            "from": "domain",
            "allow": [] // Domain has ZERO dependencies!
          }
        ]
      }
    ]
  }
}
```

### Testing Approach

**Domain Layer** (100% coverage target):
```typescript
describe('Product Aggregate', () => {
  it('should create product with valid SKU', () => {
    const product = Product.create({
      sku: 'ABC-1234-DEF',
      name: 'Widget',
      price: 19.99,
      initialInventory: 100,
    });

    expect(product.sku.toString()).toBe('ABC-1234-DEF');
    expect(product.inventory.available).toBe(100);
  });

  it('should throw error for invalid SKU format', () => {
    expect(() => {
      Product.create({ sku: 'invalid', /* ... */ });
    }).toThrow('Invalid SKU format');
  });
});
```

**Application Layer** (mocked repositories):
```typescript
describe('CreateProductHandler', () => {
  let handler: CreateProductHandler;
  let mockRepository: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      // ...
    };
    handler = new CreateProductHandler(mockRepository);
  });

  it('should create and save product', async () => {
    const command = new CreateProductCommand(/* ... */);
    mockRepository.save.mockResolvedValue(mockProduct);

    const result = await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledWith(expect.any(Product));
    expect(result.productId).toBeDefined();
  });
});
```

**Infrastructure Layer** (real database):
```typescript
describe('ProductRepository (Integration)', () => {
  let repository: ProductRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Setup test database
    dataSource = await createTestDatabase();
    repository = new ProductRepository(/* ... */);
  });

  it('should persist and retrieve product', async () => {
    const product = Product.create(/* ... */);
    await repository.save(product);

    const found = await repository.findById(product.id);

    expect(found).toBeDefined();
    expect(found.name).toBe(product.name);
  });
});
```

---

## 6. Testing Strategy for 90% Coverage

### Decision

**Layered Testing Approach**:
- **Unit Tests**: Domain + Application (95% target)
- **Integration Tests**: Infrastructure (85% target)
- **E2E Tests**: Full flows (80% target)

**Tools**:
- Jest (test runner, assertions, mocking)
- Supertest (HTTP testing)
- @nestjs/testing (TestingModule for DI)
- Docker Compose (test databases)

### Rationale

- **90% Overall Coverage**: Enforced by CI; fails build if not met
- **Layered Strategy**: Different test types for different layers; optimizes speed vs confidence
- **TDD Approach**: Write tests first for domain logic; ensures testability
- **Fast Feedback**: Unit tests run in milliseconds; integration tests in seconds; E2E in minutes

### Implementation Pattern

**1. Jest Configuration** (`jest.config.js`):

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/*.module.ts',
    '!main.ts',
  ],
  coverageDirectory: '../coverage',
  coverageThresholds: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};
```

**2. Test Setup** (`src/test/setup.ts`):

```typescript
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test utilities
global.generateId = () => `test-${Date.now()}-${Math.random()}`;

// Mock timers
jest.useFakeTimers({
  now: new Date('2025-01-01T00:00:00Z'),
});
```

**3. Unit Test Example** (Domain - Value Object):

```typescript
// domain/value-objects/price.vo.spec.ts
describe('Price Value Object', () => {
  describe('create', () => {
    it('should create price with positive value', () => {
      const price = Price.create(19.99);
      expect(price.value).toBe(19.99);
    });

    it('should throw error for negative price', () => {
      expect(() => Price.create(-10)).toThrow('Price must be positive');
    });

    it('should throw error for zero price', () => {
      expect(() => Price.create(0)).toThrow('Price must be positive');
    });
  });

  describe('formatted', () => {
    it('should format USD price', () => {
      const price = Price.create(19.99);
      expect(price.formatted()).toBe('$19.99');
    });

    it('should round to 2 decimals', () => {
      const price = Price.create(19.999);
      expect(price.formatted()).toBe('$20.00');
    });
  });

  describe('equals', () => {
    it('should return true for equal prices', () => {
      const price1 = Price.create(10.00);
      const price2 = Price.create(10.00);
      expect(price1.equals(price2)).toBe(true);
    });

    it('should return false for unequal prices', () => {
      const price1 = Price.create(10.00);
      const price2 = Price.create(15.00);
      expect(price1.equals(price2)).toBe(false);
    });
  });
});
```

**4. Unit Test Example** (Application - Command Handler):

```typescript
// application/commands/place-order.handler.spec.ts
import { Test } from '@nestjs/testing';
import { PlaceOrderHandler } from './place-order.handler';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OutboxService } from '../../../shared/infrastructure/outbox/outbox.service';
import { PlaceOrderCommand } from './place-order.command';
import { Order } from '../../domain/aggregates/order.aggregate';

describe('PlaceOrderHandler', () => {
  let handler: PlaceOrderHandler;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockOutboxService: jest.Mocked<OutboxService>;

  beforeEach(async () => {
    // Create mocks
    mockOrderRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockOutboxService = {
      saveEvent: jest.fn(),
    } as any;

    // Create handler with mocks
    handler = new PlaceOrderHandler(mockOrderRepository, mockOutboxService, null);
  });

  it('should place order and save to repository', async () => {
    const command = new PlaceOrderCommand(
      'user-123',
      [{ productId: 'prod-1', quantity: 2 }],
      { street: '123 Main St', city: 'Austin', state: 'TX', postalCode: '78701', country: 'US' },
    );

    mockOrderRepository.save.mockResolvedValue(Order.create(command) as any);

    const result = await handler.execute(command);

    expect(mockOrderRepository.save).toHaveBeenCalledWith(expect.any(Order));
    expect(result.orderId).toBeDefined();
  });

  it('should save OrderPlacedEvent to outbox', async () => {
    const command = new PlaceOrderCommand(/* ... */);
    mockOrderRepository.save.mockResolvedValue(Order.create(command) as any);

    await handler.execute(command);

    expect(mockOutboxService.saveEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'order.placed',
        aggregateId: expect.any(String),
      }),
    );
  });

  it('should throw error if repository fails', async () => {
    const command = new PlaceOrderCommand(/* ... */);
    mockOrderRepository.save.mockRejectedValue(new Error('Database error'));

    await expect(handler.execute(command)).rejects.toThrow('Database error');
  });
});
```

**5. Integration Test Example** (Infrastructure - Repository):

```typescript
// infrastructure/persistence/order.repository.integration.spec.ts
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrderRepository } from './order.repository';
import { OrderEntity } from './order.entity';
import { Order } from '../../domain/aggregates/order.aggregate';

describe('OrderRepository (Integration)', () => {
  let repository: OrderRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5433, // Test DB port
          database: 'test_db',
          username: 'test',
          password: 'test',
          entities: [OrderEntity],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([OrderEntity]),
      ],
      providers: [OrderRepository],
    }).compile();

    repository = module.get<OrderRepository>(OrderRepository);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(async () => {
    // Clean database after each test
    await dataSource.query('TRUNCATE TABLE orders CASCADE');
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('should save and retrieve order', async () => {
    const order = Order.create({
      userId: 'user-123',
      items: [{ productId: 'prod-1', quantity: 2 }],
      shippingAddress: { /* ... */ },
    });

    await repository.save(order);

    const found = await repository.findById(order.id);

    expect(found).toBeDefined();
    expect(found.id).toBe(order.id);
    expect(found.items).toHaveLength(1);
  });

  it('should return null for non-existent order', async () => {
    const found = await repository.findById('non-existent-id');
    expect(found).toBeNull();
  });
});
```

**6. E2E Test Example** (Full user flow):

```typescript
// test/e2e/checkout-flow.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Checkout Flow (E2E)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token
    authToken = await getTestAuthToken();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should complete full checkout flow', async () => {
    // 1. Add product to cart
    const cartResponse = await request(app.getHttpServer())
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productId: 'prod-123',
        quantity: 2,
      })
      .expect(201);

    expect(cartResponse.body.items).toHaveLength(1);

    // 2. Get cart
    const getCartResponse = await request(app.getHttpServer())
      .get('/api/cart')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(getCartResponse.body.items).toHaveLength(1);

    // 3. Place order
    const orderResponse = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        shippingAddress: {
          street: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'US',
        },
      })
      .expect(201);

    expect(orderResponse.body.orderId).toBeDefined();
    expect(orderResponse.body.orderNumber).toMatch(/^ORD-/);

    // 4. Verify order in history
    const historyResponse = await request(app.getHttpServer())
      .get('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(historyResponse.body.items).toContainEqual(
      expect.objectContaining({
        orderId: orderResponse.body.orderId,
      }),
    );
  });
});
```

**7. Test Utilities** (`test/utils/`):

```typescript
// test/utils/test-data-factory.ts
export class TestDataFactory {
  static createProduct(overrides?: Partial<ProductData>): Product {
    return Product.create({
      sku: 'TST-0001-ABC',
      name: 'Test Product',
      price: 19.99,
      initialInventory: 100,
      ...overrides,
    });
  }

  static createOrder(overrides?: Partial<OrderData>): Order {
    return Order.create({
      userId: 'test-user-123',
      items: [{ productId: 'prod-1', quantity: 2 }],
      shippingAddress: TestDataFactory.createAddress(),
      ...overrides,
    });
  }

  static createAddress(overrides?: Partial<AddressData>): Address {
    return {
      street: '123 Test St',
      city: 'Test City',
      state: 'TX',
      postalCode: '12345',
      country: 'US',
      ...overrides,
    };
  }
}
```

**8. Docker Compose for Test DBs** (`docker-compose.test.yml`):

```yaml
version: '3.8'

services:
  postgres-test:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: test_db
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data # In-memory for speed

  rabbitmq-test:
    image: rabbitmq:3.12-alpine
    ports:
      - "5673:5672"
```

**9. CI Pipeline** (`.github/workflows/ci.yml`):

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:cov

      - name: Check coverage threshold
        run: |
          if [ $(cat coverage/coverage-summary.json | jq '.total.lines.pct') -lt 90 ]; then
            echo "Coverage below 90%"
            exit 1
          fi

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

### Coverage Breakdown by Layer

| Layer | Target | Rationale |
|-------|--------|-----------|
| **Domain** | 95% | Pure logic, easiest to test; highest value |
| **Application** | 90% | CQRS handlers; mock repositories |
| **Infrastructure** | 85% | Integration tests slower; some DB-specific code |
| **Presentation** | 80% | Controllers thin; covered by E2E tests |

### Test Execution Strategy

**Development** (fast feedback):
```bash
npm run test:watch        # Unit tests only (< 1s)
npm run test:unit         # All unit tests (< 5s)
```

**Pre-commit** (medium confidence):
```bash
npm run test              # Unit + Integration (< 30s)
```

**CI Pipeline** (full confidence):
```bash
npm run test:cov          # All tests + coverage (< 2 min)
npm run test:e2e          # E2E tests (< 5 min)
```

---

## 7. Handlebars Templating with NestJS

### Decision

**Selected Approach**: NestJS + hbs adapter with Atomic Design component organization

**Library**: `@nestjs/platform-express` + `hbs` (Handlebars)

### Rationale

- **Server-Side Rendering**: Better SEO, faster first paint, works without JavaScript
- **Handlebars**: Logic-less templates; enforces separation between view and logic
- **Atomic Design**: Reusable components (atoms → molecules → organisms → templates → pages)
- **View Models**: Presenters transform domain objects to view-friendly data

### Implementation Pattern

**1. Bootstrap Configuration** (`main.ts`):

```typescript
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as hbs from 'hbs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configure Handlebars
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  // Register partials directory
  hbs.registerPartials(join(__dirname, '..', 'views', 'components'));
  hbs.registerPartials(join(__dirname, '..', 'views', 'organisms'));

  // Register custom helpers
  hbs.registerHelper('formatCurrency', (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  });

  hbs.registerHelper('formatDate', (date: Date) => {
    return new Intl.DateTimeFormat('en-US').format(date);
  });

  hbs.registerHelper('eq', (a, b) => a === b);
  hbs.registerHelper('gt', (a, b) => a > b);

  await app.listen(3000);
}
bootstrap();
```

**2. View Controller** (`presentation/controllers/product-view.controller.ts`):

```typescript
import { Controller, Get, Render, Param, Query, Req } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetProductsQuery } from '../../application/queries/get-products.query';
import { GetProductByIdQuery } from '../../application/queries/get-product-by-id.query';
import { ProductListPresenter } from '../presenters/product-list.presenter';
import { ProductDetailPresenter } from '../presenters/product-detail.presenter';

@Controller('products')
export class ProductViewController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly listPresenter: ProductListPresenter,
    private readonly detailPresenter: ProductDetailPresenter,
  ) {}

  @Get()
  @Render('pages/products')
  async listProducts(
    @Query('search') search: string,
    @Query('category') category: string,
    @Query('page') page: number = 1,
    @Req() req,
  ) {
    const query = new GetProductsQuery({ search, category }, { page, limit: 20 });
    const result = await this.queryBus.execute(query);

    return this.listPresenter.present(result, req.user);
  }

  @Get(':id')
  @Render('pages/product-detail')
  async productDetail(@Param('id') id: string, @Req() req) {
    const query = new GetProductByIdQuery(id);
    const product = await this.queryBus.execute(query);

    return this.detailPresenter.present(product, req.user);
  }
}
```

**3. View Presenter** (`presentation/presenters/product-list.presenter.ts`):

```typescript
export interface ProductListViewModel {
  title: string;
  products: Array<{
    id: string;
    name: string;
    sku: string;
    price: string;
    imageUrl: string;
    inStock: boolean;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  user?: {
    name: string;
    email: string;
  };
}

@Injectable()
export class ProductListPresenter {
  present(result: ProductQueryResult, user?: User): ProductListViewModel {
    return {
      title: 'Products',
      products: result.items.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: this.formatCurrency(p.price),
        imageUrl: p.imageUrl || '/images/placeholder.png',
        inStock: p.inventory > 0,
      })),
      pagination: {
        currentPage: result.page,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.page < Math.ceil(result.total / result.limit),
        hasPrev: result.page > 1,
      },
      user: user ? { name: user.username, email: user.email } : undefined,
    };
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }
}
```

**4. Atomic Design Structure**:

**Atom** (`views/components/atoms/button.hbs`):
```handlebars
<button
  type="{{type}}"
  class="{{#if primary}}bg-blue-600 hover:bg-blue-700{{else}}bg-gray-200 hover:bg-gray-300{{/if}} text-white font-bold py-2 px-4 rounded {{class}}"
  {{#if disabled}}disabled{{/if}}
>
  {{text}}
</button>
```

**Molecule** (`views/components/molecules/product-card.hbs`):
```handlebars
<div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
  <img src="{{imageUrl}}" alt="{{name}}" class="w-full h-48 object-cover" />

  <div class="p-4">
    <h3 class="text-lg font-semibold text-gray-800">{{name}}</h3>
    <p class="text-sm text-gray-600">SKU: {{sku}}</p>

    <div class="mt-4 flex items-center justify-between">
      <span class="text-xl font-bold text-blue-600">{{price}}</span>

      {{#if inStock}}
        <span class="text-sm text-green-600">In Stock</span>
      {{else}}
        <span class="text-sm text-red-600">Out of Stock</span>
      {{/if}}
    </div>

    <div class="mt-4">
      {{> atoms/button text="View Details" primary=true class="w-full"}}
    </div>
  </div>
</div>
```

**Organism** (`views/organisms/product-grid.hbs`):
```handlebars
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {{#each products}}
    <a href="/products/{{id}}" class="block">
      {{> molecules/product-card
        name=name
        sku=sku
        price=price
        imageUrl=imageUrl
        inStock=inStock
      }}
    </a>
  {{/each}}
</div>

{{#if (eq (length products) 0)}}
  <div class="text-center py-12">
    <p class="text-gray-500">No products found.</p>
  </div>
{{/if}}
```

**Template** (`views/templates/authenticated.hbs`):
```handlebars
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}} - B2B E-Commerce</title>
  <link href="/css/tailwind.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
  {{> organisms/header user=user}}

  <main class="container mx-auto px-4 py-8">
    {{{body}}}
  </main>

  {{> organisms/footer}}

  <script src="/js/main.js"></script>
</body>
</html>
```

**Page** (`views/pages/products.hbs`):
```handlebars
<div class="mb-6">
  <h1 class="text-3xl font-bold text-gray-900">{{title}}</h1>
</div>

{{> molecules/search-bar}}

<div class="mt-8">
  {{> organisms/product-grid products=products}}
</div>

<div class="mt-8">
  {{> molecules/pagination
    currentPage=pagination.currentPage
    totalPages=pagination.totalPages
    hasNext=pagination.hasNext
    hasPrev=pagination.hasPrev
  }}
</div>
```

**5. Custom Helpers** (for complex logic):

```typescript
// config/handlebars-helpers.ts
import * as hbs from 'hbs';

export function registerCustomHelpers() {
  // Conditional helpers
  hbs.registerHelper('if_eq', function(a, b, opts) {
    return a === b ? opts.fn(this) : opts.inverse(this);
  });

  // Loop helpers
  hbs.registerHelper('times', function(n, block) {
    let result = '';
    for (let i = 0; i < n; i++) {
      result += block.fn(i);
    }
    return result;
  });

  // Array helpers
  hbs.registerHelper('length', (arr) => arr?.length || 0);

  // String helpers
  hbs.registerHelper('truncate', (str: string, length: number) => {
    return str.length > length ? str.substring(0, length) + '...' : str;
  });

  // Date helpers
  hbs.registerHelper('timeAgo', (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  });
}
```

### Testing Approach

**Presenter Unit Tests**:
```typescript
describe('ProductListPresenter', () => {
  let presenter: ProductListPresenter;

  beforeEach(() => {
    presenter = new ProductListPresenter();
  });

  it('should transform products to view models', () => {
    const result = {
      items: [
        { id: '1', name: 'Widget', price: 19.99, inventory: 10 },
      ],
      page: 1,
      limit: 20,
      total: 1,
    };

    const viewModel = presenter.present(result);

    expect(viewModel.products).toHaveLength(1);
    expect(viewModel.products[0].price).toBe('$19.99');
    expect(viewModel.products[0].inStock).toBe(true);
  });
});
```

**View Rendering Tests** (E2E):
```typescript
describe('Product Pages (E2E)', () => {
  it('should render products page with correct data', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .expect(200);

    expect(response.text).toContain('<h1');
    expect(response.text).toContain('Products');
    // Check for product cards...
  });
});
```

---

## 8. Tailwind CSS Integration

### Decision

**Selected Approach**: Tailwind CSS 3.x with JIT (Just-In-Time) mode + PostCSS

**Build Process**: PostCSS processes Tailwind → CSS output served by NestJS

### Rationale

- **Utility-First**: Fast development; no naming conventions needed
- **JIT Mode**: Generate only used classes; small production bundles
- **Component Classes**: Extract common patterns with `@apply`
- **Purge CSS**: Remove unused styles in production

### Implementation Pattern

**1. Installation**:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

**2. Tailwind Configuration** (`tailwind.config.js`):

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './views/**/*.hbs',
    './src/**/*.ts', // For class lists in presenters
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          500: '#10b981',
          600: '#059669',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

**3. PostCSS Configuration** (`postcss.config.js`):

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**4. Main CSS File** (`public/css/main.css`):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom component classes */
@layer components {
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded transition-colors;
  }

  .btn-secondary {
    @apply bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded transition-colors;
  }

  .card {
    @apply bg-white rounded-lg shadow-md overflow-hidden;
  }

  .input {
    @apply block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500;
  }
}
```

**5. Build Script** (`package.json`):

```json
{
  "scripts": {
    "css:build": "tailwindcss -i ./public/css/main.css -o ./public/css/tailwind.css --minify",
    "css:watch": "tailwindcss -i ./public/css/main.css -o ./public/css/tailwind.css --watch",
    "prebuild": "npm run css:build",
    "dev": "npm run css:watch & npm run start:dev"
  }
}
```

**6. Usage in Templates**:

```handlebars
<!-- Utility classes directly -->
<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold text-gray-900 mb-6">Products</h1>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {{#each products}}
      <div class="card">
        <img src="{{imageUrl}}" class="w-full h-48 object-cover" />
        <div class="p-4">
          <h3 class="text-lg font-semibold">{{name}}</h3>
          <p class="text-gray-600">{{price}}</p>
          <button class="btn-primary mt-4 w-full">Add to Cart</button>
        </div>
      </div>
    {{/each}}
  </div>
</div>
```

### Production Optimization

**Environment-specific builds**:
```javascript
// tailwind.config.js
module.exports = {
  content: ['./views/**/*.hbs'],
  safelist: [
    // Classes dynamically added via JS
    'text-red-500',
    'text-green-500',
  ],
  theme: { /* ... */ },
};
```

**CDN Strategy** (production):
- Build CSS during deployment
- Upload to CDN (CloudFront, Cloudflare)
- Serve with cache headers

---

## Summary

All technology decisions are documented with:
- ✅ **Decision Made**: Selected approach with specific libraries/versions
- ✅ **Rationale**: Why this approach was chosen
- ✅ **Alternatives Considered**: What was rejected and why
- ✅ **Implementation Patterns**: Concrete code examples
- ✅ **Testing Approach**: How to test each technology
- ✅ **Performance Considerations**: Optimization strategies

---

## Next Steps

**Phase 1 (Design)**:
1. Create `data-model.md` with full domain model (aggregates, entities, value objects)
2. Generate `contracts/api/` with OpenAPI specifications
3. Generate `contracts/events/` with event schemas
4. Generate `contracts/queries/` with CQRS read models
5. Create `quickstart.md` with developer setup guide

**Command**: Proceed to Phase 1 or begin implementation with `/speckit.tasks`
