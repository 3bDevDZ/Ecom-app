import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config();

/**
 * TypeORM DataSource configuration for migrations
 *
 * This configuration is used by the TypeORM CLI for running migrations.
 * It's separate from the NestJS TypeORM configuration to avoid circular dependencies.
 *
 * Usage:
 * - Generate migration: npm run migration:generate -- src/migrations/MigrationName
 * - Run migrations: npm run migration:run
 * - Revert migration: npm run migration:revert
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'b2b_ecommerce',
  entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, '..', 'migrations', '*{.ts,.js}')],
  synchronize: false, // NEVER use synchronize in production
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Create and export the DataSource for CLI usage
const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
