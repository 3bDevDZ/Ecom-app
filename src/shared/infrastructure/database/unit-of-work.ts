import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';

/**
 * Unit of Work Pattern Implementation
 * 
 * Ensures transactional consistency across multiple repository operations.
 * Coordinates database operations within a single transaction.
 */
@Injectable()
export class UnitOfWork {
  private queryRunner: QueryRunner | null = null;

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Start a new transaction
   */
  async start(): Promise<void> {
    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
  }

  /**
   * Get the transaction manager
   */
  getManager(): EntityManager {
    if (!this.queryRunner) {
      throw new Error('Transaction not started. Call start() first.');
    }
    return this.queryRunner.manager;
  }

  /**
   * Commit the transaction
   */
  async commit(): Promise<void> {
    if (!this.queryRunner) {
      throw new Error('Transaction not started. Call start() first.');
    }

    try {
      await this.queryRunner.commitTransaction();
    } finally {
      await this.release();
    }
  }

  /**
   * Rollback the transaction
   */
  async rollback(): Promise<void> {
    if (!this.queryRunner) {
      throw new Error('Transaction not started. Call start() first.');
    }

    try {
      await this.queryRunner.rollbackTransaction();
    } finally {
      await this.release();
    }
  }

  /**
   * Release the query runner
   */
  private async release(): Promise<void> {
    if (this.queryRunner) {
      await this.queryRunner.release();
      this.queryRunner = null;
    }
  }

  /**
   * Execute work within a transaction
   * Automatically handles commit/rollback
   */
  async execute<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    await this.start();

    try {
      const result = await work(this.getManager());
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}

