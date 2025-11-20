# Docker Infrastructure for B2B E-Commerce Platform

This directory contains Docker configuration files for all infrastructure dependencies required by the B2B E-Commerce Platform.

## Services

### 1. **PostgreSQL** (Port 5432)
- **Image**: `postgres:15-alpine`
- **Purpose**: Main application database and Keycloak database
- **Credentials**: `ecommerce` / `ecommerce_password`
- **Databases**: 
  - `b2b_ecommerce` (main application)
  - `keycloak` (identity provider)
- **Extensions**: uuid-ossp, pg_trgm, unaccent

### 2. **RabbitMQ** (Ports 5672, 15672)
- **Image**: `rabbitmq:3.12-management-alpine`
- **Purpose**: Message broker for event-driven architecture (outbox pattern)
- **Credentials**: `ecommerce` / `ecommerce_password`
- **Management UI**: http://localhost:15672
- **Queues**:
  - `order.events` - Order domain events
  - `product.events` - Product catalog events
  - `inventory.events` - Inventory management events
  - `landing-cms.events` - CMS content events
  - `email.notifications` - Email notification queue
  - `dead-letter` - Failed message handling

### 3. **Keycloak** (Port 8080)
- **Image**: `quay.io/keycloak/keycloak:23.0`
- **Purpose**: Identity and access management (OAuth 2.0 / OIDC)
- **Admin Credentials**: `admin` / `admin`
- **Admin Console**: http://localhost:8080/admin
- **Realm**: `b2b-ecommerce`
- **Pre-configured Users**:
  - `admin@example.com` / `admin123` (admin role)
  - `buyer@example.com` / `buyer123` (buyer role)
- **Client**: `ecommerce-app` (PKCE enabled)

### 4. **MinIO** (Ports 9000, 9001)
- **Image**: `minio/minio:latest`
- **Purpose**: S3-compatible object storage for images and documents
- **Credentials**: `minioadmin` / `minioadmin`
- **Console**: http://localhost:9001
- **API Endpoint**: http://localhost:9000
- **Buckets**:
  - `product-images` - Product and variant images
  - `landing-page-assets` - CMS images and media
  - `documents` - Order documents and exports

## Quick Start

### Start All Services

```bash
# From repository root
docker-compose up -d
```

### Check Service Health

```bash
docker-compose ps
```

All services should show status as "healthy" after startup (Keycloak may take 60-90 seconds).

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f rabbitmq
docker-compose logs -f keycloak
docker-compose logs -f minio
```

### Stop All Services

```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ Data Loss)

```bash
docker-compose down -v
```

## Configuration Files

### PostgreSQL
- `postgres/init.sql` - Database initialization script
  - Creates extensions (UUID, pg_trgm, unaccent)
  - Sets up schemas and permissions

### RabbitMQ
- `rabbitmq/rabbitmq.conf` - Server configuration
- `rabbitmq/definitions.json` - Exchanges, queues, and bindings
  - Topic exchange: `ecommerce.events`
  - Dead letter exchange: `ecommerce.dlx`
  - Routing patterns for domain events

### Keycloak
- `keycloak/realm-export.json` - Pre-configured realm
  - Client configuration with PKCE
  - Test users with roles
  - Token lifespans and session settings

## Environment Variables

Copy `.env.example` to `.env` and customize if needed:

```bash
cp docker/.env.example .env
```

Default values are suitable for local development.

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| PostgreSQL | `localhost:5432` | `ecommerce` / `ecommerce_password` |
| RabbitMQ AMQP | `localhost:5672` | `ecommerce` / `ecommerce_password` |
| RabbitMQ Management | http://localhost:15672 | `ecommerce` / `ecommerce_password` |
| Keycloak Admin | http://localhost:8080/admin | `admin` / `admin` |
| Keycloak Realm | http://localhost:8080/realms/b2b-ecommerce | - |
| MinIO Console | http://localhost:9001 | `minioadmin` / `minioadmin` |
| MinIO API | http://localhost:9000 | `minioadmin` / `minioadmin` |

## Health Checks

All services include health checks that Docker monitors:

- **PostgreSQL**: `pg_isready` check every 10s
- **RabbitMQ**: `rabbitmq-diagnostics ping` every 10s
- **Keycloak**: HTTP health endpoint check every 15s
- **MinIO**: HTTP live check every 10s

## Data Persistence

All service data is persisted in Docker volumes:

- `postgres_data` - Database files
- `rabbitmq_data` - Message queue data
- `keycloak_data` - Identity provider data
- `minio_data` - Object storage files

Volumes survive container restarts and `docker-compose down` commands.

## Troubleshooting

### Keycloak Won't Start
- Ensure PostgreSQL is fully healthy first
- Check logs: `docker-compose logs keycloak`
- Keycloak needs 60-90s to initialize on first run

### RabbitMQ Management UI Not Accessible
- Wait for health check to pass
- Verify port 15672 is not in use: `netstat -an | grep 15672`

### Port Conflicts
- Check if ports are already in use
- Modify ports in `.env` file
- Restart services: `docker-compose down && docker-compose up -d`

### Reset Everything
```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Remove images (optional)
docker-compose down -v --rmi all

# Start fresh
docker-compose up -d
```

## Production Considerations

⚠️ **This configuration is for local development only.**

For production:
1. Use strong passwords (generate with password manager)
2. Enable SSL/TLS for all services
3. Use managed database services (AWS RDS, Azure Database)
4. Use managed message brokers (AWS MQ, Azure Service Bus)
5. Use managed identity providers (Auth0, Okta, or hosted Keycloak)
6. Use cloud object storage (AWS S3, Azure Blob Storage)
7. Implement backup strategies
8. Configure monitoring and alerting
9. Use secrets management (Vault, AWS Secrets Manager)
10. Review and harden security settings

