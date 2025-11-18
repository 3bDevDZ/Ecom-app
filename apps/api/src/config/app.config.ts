import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3333', 10),
  environment: process.env.NODE_ENV || 'development',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3333'],
  sessionSecret: process.env.SESSION_SECRET || 'change-me-in-production',
  
  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'localhost',
    port: parseInt(process.env.EMAIL_PORT || '1025', 10), // MailHog default
    secure: process.env.EMAIL_SECURE === 'true',
    from: process.env.EMAIL_FROM || 'noreply@b2b-ecommerce.com',
    retryAttempts: parseInt(process.env.EMAIL_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY || '5000', 10),
  },

  // MinIO/S3 configuration
  storage: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucket: process.env.MINIO_BUCKET || 'ecommerce-assets',
    useSSL: process.env.MINIO_USE_SSL === 'true',
  },

  // Business rules
  business: {
    inventoryReservationTimeout: parseInt(process.env.INVENTORY_RESERVATION_TIMEOUT || '1800000', 10), // 30 minutes in ms
    cartExpirationDays: parseInt(process.env.CART_EXPIRATION_DAYS || '30', 10),
    defaultPagination: {
      limit: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
      maxLimit: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
    },
  },
}));

