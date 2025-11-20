import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'ecommerce',
  password: process.env.DATABASE_PASSWORD || 'ecommerce_password',
  database: process.env.DATABASE_NAME || 'b2b_ecommerce',
  ssl: process.env.DATABASE_SSL === 'true',
  synchronize: false, // Always use migrations in production
  logging: process.env.NODE_ENV === 'development',
  maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10', 10),
  retryAttempts: parseInt(process.env.DATABASE_RETRY_ATTEMPTS || '3', 10),
  retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY || '3000', 10),
}));

