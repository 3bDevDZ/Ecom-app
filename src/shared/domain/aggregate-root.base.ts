import { AggregateRoot as NestAggregateRoot } from '@nestjs/cqrs';

/**
 * Base class for all Aggregates in the domain layer
 * 
 * Extends NestJS CQRS AggregateRoot to provide domain event functionality
 * following DDD principles.
 */
export abstract class AggregateRoot extends NestAggregateRoot {
  protected readonly _id: string;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: string) {
    super();
    this._id = id;
    this._createdAt = new Date();
    this._updatedAt = new Date();
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
}

