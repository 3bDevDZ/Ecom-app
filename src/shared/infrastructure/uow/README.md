# Generic Unit of Work with Automatic Event Collection

This module provides a generic Unit of Work pattern with automatic domain event detection and collection. It works with any entity type and automatically saves events to the outbox table within the same transaction.

## Features

- ✅ **Generic**: Works with any entity, not tied to specific aggregates
- ✅ **Automatic Event Detection**: TypeORM subscriber automatically detects changes
- ✅ **Transactional**: Events are saved to outbox within the same transaction
- ✅ **DDD Compliant**: Domain defines events, infrastructure detects them
- ✅ **Outbox Pattern**: Events are persisted reliably before publishing

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                GENERIC UNIT OF WORK SCOPE                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Use Case ──→ Domain Aggregate ──→ [events added]           │
│                            │                                  │
│                            ↓                                  │
│                     Save Operation (via Repository)          │
│                            │                                  │
│                            ↓                                  │
│              EntityChangeSubscriber (auto-detects)           │
│                            │                                  │
│                            ↓                                  │
│              UnitOfWorkContext (collects events)            │
│                            │                                  │
│                            ↓                                  │
│              OutboxService (saves to outbox)                 │
│                            │                                  │
│                            ↓                                  │
│                     Transaction Commit                       │
│                            │                                  │
│                            ↓                                  │
│              OutboxProcessor (publishes to RabbitMQ)        │
└──────────────────────────────────────────────────────────────┘
```

## Usage

### Basic Usage (Recommended)

**Important**: Since TypeORM entities are separate from domain aggregates (via mappers), repositories need to explicitly collect events from domain aggregates and add them to the UnitOfWorkContext.

```typescript
import { Injectable } from "@nestjs/common";
import { UnitOfWorkService } from "@shared/infrastructure/uow/unit-of-work.service";
import { UnitOfWorkContext } from "@shared/infrastructure/uow/unit-of-work.context";
import { UserRepository } from "../infrastructure/persistence/user.repository";
import { User } from "../domain/entities/user.entity";

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWorkService,
    private readonly userRepository: UserRepository
  ) {}

  async execute(userId: string, email: string): Promise<void> {
    await this.unitOfWork.execute(async (manager) => {
      // Load user (domain aggregate)
      const user = await this.userRepository.findById(userId, manager);

      // Update email (domain logic)
      user.updateEmail(email); // This adds UserEmailChangedEvent internally

      // Save user (repository should collect events - see Repository Pattern below)
      await this.userRepository.save(user, manager);

      // Events are automatically:
      // 1. Collected by repository from domain aggregate
      // 2. Added to UnitOfWorkContext
      // 3. Saved to outbox table (same transaction)
      // 4. Published later by OutboxProcessor
    });
  }
}
```

### Repository Pattern

Repositories should collect events from domain aggregates and add them to the UnitOfWorkContext:

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";
import { UnitOfWorkService } from "@shared/infrastructure/uow/unit-of-work.service";
import { UnitOfWorkContext } from "@shared/infrastructure/uow/unit-of-work.context";
import { User } from "../../domain/entities/user.entity";
import { UserEntity } from "../entities/user.entity";

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
    private readonly unitOfWork: UnitOfWorkService
  ) {}

  async save(user: User, manager?: EntityManager): Promise<void> {
    const entity = UserMapper.toPersistence(user);
    const repo = manager ? manager.getRepository(UserEntity) : this.repository;

    await repo.save(entity);

    // Collect events from domain aggregate and add to context
    if (manager?.queryRunner) {
      const context = UnitOfWorkContext.getOrCreate(manager.queryRunner);
      const events = user.getDomainEvents();
      if (events.length > 0) {
        context.addEvents(events);
        user.clearDomainEvents();
      }
    }
  }
}
```

### Manual Transaction Control

```typescript
import { Injectable } from "@nestjs/common";
import { UnitOfWorkService } from "@shared/infrastructure/uow/unit-of-work.service";

@Injectable()
export class ComplexUseCase {
  constructor(private readonly unitOfWork: UnitOfWorkService) {}

  async execute(): Promise<void> {
    const { manager, context, commit, rollback } =
      await this.unitOfWork.start();

    try {
      // Perform multiple operations
      const user = await this.userRepository.save(newUser, manager);
      const order = await this.orderRepository.save(newOrder, manager);

      // Manually add events if needed
      context.addEvent(new CustomEvent(user.id));

      // Commit (saves events to outbox automatically)
      await commit();
    } catch (error) {
      await rollback();
      throw error;
    }
  }
}
```

## How It Works

### 1. Domain Aggregate Adds Events

```typescript
export class User extends AggregateRoot {
  private email: string;

  updateEmail(newEmail: string): void {
    const oldEmail = this.email;
    this.email = newEmail;
    this.touch();

    // Domain explicitly adds event
    this.addDomainEvent(new UserEmailChangedEvent(this.id, oldEmail, newEmail));
  }
}
```

### 2. TypeORM Subscriber Detects Changes

The `EntityChangeSubscriber` automatically:

- Listens to Insert, Update, and Remove events
- Extracts domain events from aggregates
- Adds them to the current `UnitOfWorkContext`

### 3. UnitOfWorkService Saves Events

When the transaction commits:

- All events in `UnitOfWorkContext` are saved to the outbox table
- This happens within the same transaction (atomicity guaranteed)

### 4. OutboxProcessor Publishes Events

A background job (runs every 5 seconds) publishes events from the outbox to RabbitMQ.

## Change Detection

The system supports automatic change detection:

```typescript
export class User extends AggregateRoot {
  protected __getCurrentState(): Record<string, any> {
    return {
      ...super.__getCurrentState(),
      email: this.email,
      name: this.name,
    };
  }
}

// After update, you can check what changed:
const changes = user.__getChangedFields();
// Returns: { email: { old: 'old@example.com', new: 'new@example.com' } }
```

## Benefits

1. **No Manual Event Publishing**: Events are automatically collected and saved
2. **Transactional Safety**: Events are saved atomically with business data
3. **Generic**: Works for User, Product, Order, Payment, etc.
4. **Testable**: Mock UnitOfWorkContext in unit tests
5. **Scalable**: Add new entities without code duplication

## Migration from Old Pattern

**Before:**

```typescript
await this.orderRepository.save(order);
const events = order.getDomainEvents();
events.forEach((event) => this.eventBus.publish(event));
order.clearDomainEvents();
```

**After:**

```typescript
await this.unitOfWork.execute(async (manager) => {
  await this.orderRepository.save(order, manager);
  // Events automatically collected and saved to outbox
});
```

## Testing

```typescript
describe("UpdateUserUseCase", () => {
  it("should save events to outbox", async () => {
    const mockUnitOfWork = {
      execute: jest.fn(async (work) => {
        const mockManager = {} as EntityManager;
        return work(mockManager);
      }),
    };

    const useCase = new UpdateUserUseCase(mockUnitOfWork, mockUserRepository);
    await useCase.execute("user-1", "new@example.com");

    // Verify transaction was used
    expect(mockUnitOfWork.execute).toHaveBeenCalled();
  });
});
```
