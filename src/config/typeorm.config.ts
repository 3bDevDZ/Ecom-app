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
  host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '5432', 10),
  username: process.env.DATABASE_USER || process.env.DB_USERNAME || 'ecommerce',
  password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'ecommerce_password',
  database: process.env.DATABASE_NAME || process.env.DB_DATABASE || 'b2b_ecommerce',
  entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, '..', 'migrations', '*{.ts,.js}')],
  synchronize: false, // NEVER use synchronize in production
  logging: process.env.DB_LOGGING === 'true' || process.env.NODE_ENV === 'development',
  ssl: process.env.DATABASE_SSL === 'true' || process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Create and export the DataSource for CLI usage
const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
