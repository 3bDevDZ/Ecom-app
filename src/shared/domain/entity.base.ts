/**
 * Base class for all Entities in the domain layer
 *
 * Entities have identity and lifecycle, unlike Value Objects.
 * They are equal if their IDs are equal.
 *
 * Supports change tracking for automatic domain event detection.
 */
export abstract class Entity {
  protected readonly _id: string;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  /**
   * Original state snapshot for change detection
   * Used by TypeORM subscribers to detect what changed
   */
  protected __originalState?: Record<string, any>;

  /**
   * Flag to indicate if this entity is new (not yet persisted)
   */
  protected __isNew: boolean = true;

  constructor(id: string) {
    this._id = id;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this.__isNew = true;
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  public equals(entity: Entity): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    return this._id === entity._id;
  }

  /**
   * Mark entity as persisted (called by repository after save)
   * This saves the current state for change detection
   */
  public __markAsPersisted(): void {
    this.__isNew = false;
    this.__originalState = this.__getCurrentState();
  }

  /**
   * Get current state snapshot for change detection
   * Override in subclasses to include only relevant properties
   */
  protected __getCurrentState(): Record<string, any> {
    return {
      id: this._id,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * Get changed fields compared to original state
   * Returns object with field names as keys and { old, new } as values
   */
  public __getChangedFields(): Record<string, { old: any; new: any }> {
    if (this.__isNew || !this.__originalState) {
      return {};
    }

    const currentState = this.__getCurrentState();
    const changes: Record<string, { old: any; new: any }> = {};

    for (const key in currentState) {
      if (currentState[key] !== this.__originalState[key]) {
        changes[key] = {
          old: this.__originalState[key],
          new: currentState[key],
        };
      }
    }

    return changes;
  }

  /**
   * Check if entity is new (not yet persisted)
   */
  public __isNewEntity(): boolean {
    return this.__isNew;
  }
}

