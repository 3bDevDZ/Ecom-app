import { DataSource, DataSourceOptions } from 'typeorm';
import { v4 as uuid } from 'uuid';

/**
 * Test Database Helper
 *
 * Provides utilities for setting up and tearing down test databases.
 * Each test suite gets its own isolated database to prevent interference.
 *
 * @example
 * describe('ProductRepository', () => {
 *   let dataSource: DataSource;
 *
 *   beforeAll(async () => {
 *     dataSource = await TestDatabaseHelper.createTestDatabase();
 *   });
 *
 *   afterAll(async () => {
 *     await TestDatabaseHelper.closeTestDatabase(dataSource);
 *   });
 * });
 */
export class TestDatabaseHelper {
  private static testDatabases: Map<string, DataSource> = new Map();

  /**
   * Create an isolated test database
   */
  static async createTestDatabase(entities?: any[]): Promise<DataSource> {
    const testDbName = `test_${uuid().replace(/-/g, '_')}`;

    try {
      // First, connect to default postgres database to create test database
      const adminDataSource = new DataSource({
        type: 'postgres',
        host: process.env.TEST_DB_HOST || 'localhost',
        port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
        username: process.env.TEST_DB_USERNAME || 'postgres',
        password: process.env.TEST_DB_PASSWORD || 'postgres',
        database: 'postgres',
      });

      await adminDataSource.initialize();
      await adminDataSource.query(`CREATE DATABASE ${testDbName}`);
      await adminDataSource.destroy();

      // Now connect to the test database
      const testDataSourceOptions: DataSourceOptions = {
        type: 'postgres',
        host: process.env.TEST_DB_HOST || 'localhost',
        port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
        username: process.env.TEST_DB_USERNAME || 'postgres',
        password: process.env.TEST_DB_PASSWORD || 'postgres',
        database: testDbName,
        entities: entities || [],
        synchronize: true, // OK for tests - creates schema automatically
        logging: false,
        dropSchema: false,
      };

      const testDataSource = new DataSource(testDataSourceOptions);
      await testDataSource.initialize();

      this.testDatabases.set(testDbName, testDataSource);

      return testDataSource;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('\n❌ Failed to create test database. PostgreSQL may not be running.');
      console.error('To run integration tests, ensure PostgreSQL is running on localhost:5432');
      console.error(`Error: ${errorMessage}\n`);
      throw new Error(
        'Integration tests require PostgreSQL. Please start PostgreSQL or skip integration tests.',
      );
    }
  }

  /**
   * Close and drop test database
   */
  static async closeTestDatabase(dataSource: DataSource): Promise<void> {
    if (!dataSource || !dataSource.isInitialized) {
      return; // Database was never initialized, nothing to close
    }

    const dbName = dataSource.options.database as string;

    // Drop all tables and close connection
    await dataSource.dropDatabase();
    await dataSource.destroy();

    // Connect to postgres database to drop the test database
    const adminDataSource = new DataSource({
      type: 'postgres',
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
      username: process.env.TEST_DB_USERNAME || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'postgres',
      database: 'postgres',
    });

    try {
      await adminDataSource.initialize();
      // Terminate all connections to the test database
      await adminDataSource.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '${dbName}'
          AND pid <> pg_backend_pid();
      `);
      await adminDataSource.query(`DROP DATABASE IF EXISTS ${dbName}`);
    } finally {
      await adminDataSource.destroy();
    }

    this.testDatabases.delete(dbName);
  }

  /**
   * Clear all data from tables (useful between tests)
   */
  static async clearDatabase(dataSource: DataSource): Promise<void> {
    if (!dataSource || !dataSource.isInitialized) {
      return; // Database was never initialized, nothing to clear
    }

    const entities = dataSource.entityMetadatas;

    // Disable foreign key checks
    await dataSource.query('SET session_replication_role = replica;');

    // Truncate all tables
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
    }

    // Re-enable foreign key checks
    await dataSource.query('SET session_replication_role = DEFAULT;');
  }

  /**
   * Seed database with test data
   */
  static async seedDatabase(dataSource: DataSource, seedFn: (ds: DataSource) => Promise<void>): Promise<void> {
    await seedFn(dataSource);
  }
}
