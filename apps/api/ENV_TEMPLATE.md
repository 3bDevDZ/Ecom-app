# Environment Variables Template

This file contains the template for `.env.example` which is blocked by globalIgnore.
Copy this content to create your own `.env` file.

## Create .env file

```bash
# Copy this content to apps/api/.env
```

## Environment Variables

```env
# Application
NODE_ENV=development
PORT=3333
CORS_ORIGINS=http://localhost:3333,http://localhost:4200

# Session
SESSION_SECRET=change-me-in-production-use-a-long-random-string

# Database (PostgreSQL)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=ecommerce
DATABASE_PASSWORD=ecommerce_password
DATABASE_NAME=b2b_ecommerce
DATABASE_SSL=false
DATABASE_MAX_CONNECTIONS=10
DATABASE_RETRY_ATTEMPTS=3
DATABASE_RETRY_DELAY=3000

# Keycloak Authentication
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=b2b-ecommerce
KEYCLOAK_CLIENT_ID=ecommerce-app
KEYCLOAK_CLIENT_SECRET=your-client-secret-from-keycloak
KEYCLOAK_PUBLIC_KEY=your-realm-public-key-from-keycloak
KEYCLOAK_CALLBACK_URL=http://localhost:3333/api/auth/callback

# JWT Configuration
JWT_SECRET=change-me-in-production-use-a-long-random-string
JWT_EXPIRES_IN=1h

# RabbitMQ Messaging
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_DOMAIN_EVENTS_EXCHANGE=domain.events
RABBITMQ_INTEGRATION_EVENTS_EXCHANGE=integration.events
RABBITMQ_DEAD_LETTER_EXCHANGE=dead.letter
RABBITMQ_ORDER_EVENTS_QUEUE=order.events
RABBITMQ_INVENTORY_EVENTS_QUEUE=inventory.events
RABBITMQ_NOTIFICATION_EVENTS_QUEUE=notification.events
RABBITMQ_DEAD_LETTER_QUEUE=dead.letter.queue
RABBITMQ_RETRY_ATTEMPTS=5
RABBITMQ_RETRY_DELAY=5000
RABBITMQ_MESSAGE_TTL=604800000
RABBITMQ_PREFETCH_COUNT=10

# Email Configuration (MailHog for development)
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_SECURE=false
EMAIL_FROM=noreply@b2b-ecommerce.com
EMAIL_RETRY_ATTEMPTS=3
EMAIL_RETRY_DELAY=5000

# MinIO/S3 Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=ecommerce-assets
MINIO_USE_SSL=false

# Business Rules
INVENTORY_RESERVATION_TIMEOUT=1800000
CART_EXPIRATION_DAYS=30
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100

# Logging
LOG_LEVEL=debug
```

## Quick Setup

1. Copy the above environment variables to `apps/api/.env`
2. Update the values according to your environment
3. For production, make sure to:
   - Change `SESSION_SECRET` to a secure random string
   - Change `JWT_SECRET` to a secure random string
   - Update `KEYCLOAK_CLIENT_SECRET` from Keycloak admin console
   - Update `KEYCLOAK_PUBLIC_KEY` from Keycloak realm settings
   - Set `NODE_ENV=production`
   - Enable SSL for database and MinIO if needed
   - Configure proper CORS origins

## Getting Keycloak Credentials

1. Access Keycloak admin at http://localhost:8080
2. Login with admin/admin (from docker-compose.yml)
3. Select realm: `b2b-ecommerce`
4. Go to Clients → `ecommerce-app`
5. Copy the client secret from the Credentials tab
6. Get the public key from Realm Settings → Keys → RS256 → Public Key

## Production Considerations

- Use environment-specific .env files (.env.production, .env.staging)
- Never commit .env files to version control
- Use secret management services (AWS Secrets Manager, Azure Key Vault, etc.)
- Enable SSL/TLS for all external connections
- Use strong, randomly generated secrets
- Implement proper log rotation for production
- Configure appropriate connection pool sizes
- Set up monitoring and alerting

