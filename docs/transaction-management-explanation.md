# Transaction Management in BaseRepository

## Terminology Clarification

### ❌ "Nested Transaction" is NOT the correct term

**What we're actually doing:**
- **Transaction Reuse** or **Participating in Existing Transaction**
- We detect if a transaction is already active
- We reuse the same QueryRunner and EntityManager
- We do NOT create a new nested transaction

### Why "Nested Transaction" is wrong:

1. **TypeORM doesn't support true nested transactions**
   - PostgreSQL doesn't support nested transactions (only savepoints)
   - TypeORM will either fail or use the same connection
   - Starting a transaction while one is active can cause errors

2. **What we're doing:**
   - Detecting existing transaction: `isInExistingTransaction`
   - Reusing the same QueryRunner
   - All operations happen in the SAME transaction level

## Do We Need This Detection?

### ✅ YES - It's Essential for Atomicity

**Scenario: Order Placement Flow**

```
1. Handler calls: orderRepository.save(order)
   └─> BaseRepository.save() starts Transaction T1
       └─> doSave() persists order entity
       └─> Tracks order aggregate
       └─> Collects OrderPlaced event
       └─> EventBus.publish(OrderPlaced) [SYNCHRONOUS]
           └─> OrderPlacedCartConverterHandler.handle()
               └─> cartRepository.save(cart)  ← Called during T1!
                   └─> BaseRepository.save() detects T1 exists
                   └─> Reuses T1 (doesn't start new transaction)
                   └─> doSave() persists cart entity
                   └─> Returns (doesn't commit - T1 still active)
       └─> Saves events to outbox (still in T1)
       └─> Commits T1 (both order AND cart are committed together)
```

### What happens WITHOUT detection:

```typescript
// ❌ Without detection:
async save(aggregate: TAggregate): Promise<void> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.startTransaction();  // ❌ ERROR: Transaction already active!
  // OR: Creates separate connection (not atomic)
}
```

**Problems:**
1. **Error**: "Transaction already started" exception
2. **OR**: Separate transaction → order and cart NOT atomic
3. **Data inconsistency**: Order saved, cart conversion fails → order exists but cart still active

### What happens WITH detection:

```typescript
// ✅ With detection:
async save(aggregate: TAggregate): Promise<void> {
  if (isInExistingTransaction) {
    // Reuse existing transaction ✅
    queryRunner = existingQueryRunner;
    // All operations in SAME transaction
  }
}
```

**Benefits:**
1. ✅ **Atomicity**: Order + Cart conversion in same transaction
2. ✅ **Consistency**: All or nothing
3. ✅ **No errors**: Doesn't try to start duplicate transaction

## Why Track All Changes in Same Transaction?

### Example: Order Placement

**Without transaction reuse:**
```
Transaction T1: Save order ✅
Transaction T2: Convert cart ✅
```

**Problem:** If T2 fails after T1 commits:
- Order exists in database
- Cart is still ACTIVE (should be CONVERTED)
- **Data inconsistency!**

**With transaction reuse:**
```
Transaction T1:
  - Save order ✅
  - Convert cart ✅
  - Commit both together ✅
```

**Result:** Either both succeed or both fail → **Atomicity guaranteed**

## Conclusion

1. **Terminology**: Use "transaction reuse" or "participating in existing transaction", NOT "nested transaction"

2. **Necessity**: YES, we absolutely need this detection because:
   - EventBus handlers run synchronously during save()
   - Handlers may call other repositories
   - All operations must be atomic (same transaction)
   - Without detection, we'd get errors or data inconsistency

3. **Tracking**: The UnitOfWorkContext tracks all aggregates and events within the transaction, ensuring:
   - All domain events are collected
   - All events are dispatched
   - All events are saved to outbox
   - All within the same transaction boundary

