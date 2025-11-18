# Quick Start Guide: B2B E-Commerce Platform MVP

**Feature**: B2B E-Commerce Platform MVP  
**Last Updated**: 2025-11-18  
**Prerequisites**: Node.js 18+, Docker, Git

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Infrastructure Services](#infrastructure-services)
4. [Application Setup](#application-setup)
5. [Running the Application](#running-the-application)
6. [Development Workflow](#development-workflow)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v18.x or v20.x ([Download](https://nodejs.org/))
- **npm**: v10+ (comes with Node.js)
- **Docker Desktop**: Latest version ([Download](https://www.docker.com/products/docker-desktop))
- **Git**: Latest version
- **Code Editor**: VS Code recommended with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

### System Requirements

- **RAM**: 8GB minimum, 16GB recommended
- **Disk Space**: 10GB free
- **OS**: Windows 10/11, macOS 10.15+, or Linux

### Verify Installation

```bash
# Check versions
node --version    # Should show v18.x or v20.x
npm --version     # Should show v10.x+
docker --version  # Should show Docker version 20.x+
git --version     # Any recent version
```

---

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd Ecom-app
```

### 2. Checkout Feature Branch

```bash
git checkout 001-b2b-ecommerce-platform
```

### 3. Install Dependencies

```bash
cd apps/api
npm install --legacy-peer-deps
```

> **Note**: `--legacy-peer-deps` flag resolves peer dependency conflicts between NestJS packages.

---

## Infrastructure Services

### Start All Services

The application requires PostgreSQL, RabbitMQ, Keycloak, and MinIO. Start them with Docker Compose:

```bash
# From repository root
docker-compose up -d
```

### Verify Services

```bash
# Check all services are running
docker-compose ps

# Expected output: All services show "healthy" status
```

### Service Access

| Service | URL | Credentials |
|---------|-----|-------------|
| **PostgreSQL** | `localhost:5432` | `ecommerce` / `ecommerce_password` |
| **RabbitMQ Management** | http://localhost:15672 | `ecommerce` / `ecommerce_password` |
| **Keycloak Admin** | http://localhost:8080/admin | `admin` / `admin` |
| **Keycloak Realm** | http://localhost:8080/realms/b2b-ecommerce | - |
| **MinIO Console** | http://localhost:9001 | `minioadmin` / `minioadmin` |

### Initial Setup Verification

#### Keycloak Configuration

1. Open http://localhost:8080/admin
2. Login with `admin` / `admin`
3. Verify `b2b-ecommerce` realm exists
4. Verify `ecommerce-app` client exists
5. Verify test users exist:
   - `admin@example.com` / `admin123` (admin role)
   - `buyer@example.com` / `buyer123` (buyer role)

#### RabbitMQ Configuration

1. Open http://localhost:15672
2. Login with `ecommerce` / `ecommerce_password`
3. Navigate to **Queues** tab
4. Verify queues exist:
   - `order.events`
   - `product.events`
   - `inventory.events`
   - `landing-cms.events`
   - `email.notifications`
   - `dead-letter`

#### MinIO Configuration

1. Open http://localhost:9001
2. Login with `minioadmin` / `minioadmin`
3. Verify buckets exist:
   - `product-images`
   - `landing-page-assets`
   - `documents`

---

## Application Setup

### 1. Environment Configuration

```bash
cd apps/api
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Application
NODE_ENV=development
PORT=3333

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=ecommerce
DATABASE_PASSWORD=ecommerce_password
DATABASE_NAME=b2b_ecommerce

# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=b2b-ecommerce
KEYCLOAK_CLIENT_ID=ecommerce-app
KEYCLOAK_CLIENT_SECRET=your-client-secret-from-keycloak
KEYCLOAK_PUBLIC_KEY=<public-key-from-keycloak>

# RabbitMQ
RABBITMQ_URL=amqp://ecommerce:ecommerce_password@localhost:5672
RABBITMQ_EXCHANGE=ecommerce.events
RABBITMQ_DLX=ecommerce.dlx

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false

# Email (for development, use MailHog or similar)
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@ecommerce.local

# Application Settings
JWT_SECRET=your-secure-jwt-secret-change-in-production
INVENTORY_RESERVATION_TIMEOUT_MINUTES=30
CART_EXPIRY_DAYS=7
EMAIL_RETRY_ATTEMPTS=3
```

### 2. Get Keycloak Public Key

```bash
# Get realm public key
curl http://localhost:8080/realms/b2b-ecommerce | jq -r '.public_key'

# Copy the key and add to .env as KEYCLOAK_PUBLIC_KEY
```

### 3. Get Keycloak Client Secret

1. Open Keycloak Admin Console
2. Navigate to `b2b-ecommerce` realm → Clients → `ecommerce-app`
3. Go to **Credentials** tab
4. Copy **Client Secret**
5. Add to `.env` as `KEYCLOAK_CLIENT_SECRET`

### 4. Database Migrations

```bash
cd apps/api

# Run migrations
npm run migration:run

# Verify tables created
npm run migration:show
```

### 5. Seed Initial Data (Optional)

```bash
# Seed categories and sample products
npm run seed

# This creates:
# - Product categories (Electronics, Office Supplies, Industrial, etc.)
# - Sample products with variants
# - Sample landing page content
```

---

## Running the Application

### Development Mode

```bash
cd apps/api

# Start with hot-reload
npm run start:dev
```

**Application URL**: http://localhost:3333

### Production Build

```bash
cd apps/api

# Build application
npm run build

# Start production server
npm run start:prod
```

### Verify Application

1. **Health Check**: http://localhost:3333/health
   - Should return `{ "status": "ok" }`

2. **API Documentation**: http://localhost:3333/api/docs
   - Swagger UI with all endpoints

3. **Landing Page**: http://localhost:3333/
   - Should display CMS-driven landing page

4. **Login Flow**: http://localhost:3333/login
   - Redirects to Keycloak
   - Login with `buyer@example.com` / `buyer123`
   - Redirects back to application

---

## Development Workflow

### Project Structure

```
apps/api/
├── src/
│   ├── modules/              # Bounded contexts
│   │   ├── landing-cms/      # Landing page CMS
│   │   ├── product-catalog/  # Products & search
│   │   ├── order-management/ # Cart, checkout, orders
│   │   └── identity/         # Keycloak integration
│   ├── shared/               # Shared kernel
│   │   ├── domain/           # Base entities, value objects
│   │   ├── application/      # Base commands, queries
│   │   └── infrastructure/   # Outbox, messaging, database
│   ├── common/               # Cross-cutting concerns
│   │   ├── filters/          # Exception filters
│   │   ├── interceptors/     # Logging, transformation
│   │   ├── pipes/            # Validation
│   │   └── middleware/       # Request logging
│   ├── config/               # Configuration modules
│   ├── views/                # Handlebars templates
│   │   ├── components/       # Atoms, molecules, organisms
│   │   ├── templates/        # Page layouts
│   │   └── pages/            # Full pages
│   ├── public/               # Static assets
│   ├── main.ts               # Application entry point
│   └── app.module.ts         # Root module
└── test/
    ├── unit/                 # Unit tests
    ├── integration/          # Integration tests
    └── e2e/                  # End-to-end tests
```

### Common Tasks

#### Create New Module

```bash
# Generate NestJS module
nest generate module modules/my-feature

# Generate controller
nest generate controller modules/my-feature/presentation/controllers/my-feature

# Generate service
nest generate service modules/my-feature/application/services/my-feature
```

#### Run Linter

```bash
cd apps/api
npm run lint
```

#### Format Code

```bash
cd apps/api
npm run format
```

#### Generate Migration

```bash
cd apps/api

# Generate migration from entity changes
npm run migration:generate -- -n MigrationName

# Create empty migration
npm run migration:create -- -n MigrationName
```

#### Revert Migration

```bash
cd apps/api
npm run migration:revert
```

---

## Testing

### Run All Tests

```bash
cd apps/api
npm test
```

### Run Tests with Coverage

```bash
cd apps/api
npm run test:cov

# Coverage report in coverage/lcov-report/index.html
```

### Run Unit Tests Only

```bash
cd apps/api
npm run test -- --testPathPattern=unit
```

### Run Integration Tests

```bash
cd apps/api
npm run test -- --testPathPattern=integration
```

### Run E2E Tests

```bash
cd apps/api
npm run test:e2e
```

### Watch Mode (for development)

```bash
cd apps/api
npm run test:watch
```

### Test Coverage Threshold

- **Target**: 90% coverage across all files
- **Enforced in CI**: Build fails if coverage < 90%
- **Excluded**: DTOs, entities, modules, migrations

---

## Troubleshooting

### Docker Services Won't Start

**Issue**: Port conflicts

```bash
# Check what's using ports
netstat -an | findstr "5432 5672 8080 9000"

# Stop conflicting services or modify docker-compose.yml ports
```

**Issue**: Keycloak health check failing

```bash
# Keycloak takes 60-90 seconds to start initially
# Check logs
docker-compose logs keycloak

# Restart if needed
docker-compose restart keycloak
```

### Database Connection Errors

**Issue**: `ECONNREFUSED` to PostgreSQL

```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Verify credentials in .env match docker-compose.yml
```

**Issue**: Migration errors

```bash
# Reset database (⚠️ DATA LOSS)
docker-compose down -v
docker-compose up -d
npm run migration:run
```

### Keycloak Authentication Issues

**Issue**: "Invalid token" errors

```bash
# Verify public key in .env matches Keycloak
curl http://localhost:8080/realms/b2b-ecommerce | jq -r '.public_key'

# Update KEYCLOAK_PUBLIC_KEY in .env
```

**Issue**: Redirect loops

- Check `KEYCLOAK_URL` in `.env` (use `http://localhost:8080`, not `127.0.0.1`)
- Verify redirect URIs in Keycloak client configuration include `http://localhost:3333/*`

### RabbitMQ Connection Issues

**Issue**: "Connection refused" to RabbitMQ

```bash
# Check RabbitMQ is healthy
docker-compose ps rabbitmq

# Verify credentials
# Default: ecommerce / ecommerce_password
```

**Issue**: Messages not being processed

```bash
# Check dead-letter queue
# Open http://localhost:15672 → Queues → dead-letter

# View messages in queue to see errors
```

### Application Won't Start

**Issue**: Port 3333 already in use

```bash
# Change PORT in .env
PORT=3334

# Or kill process using port 3333
```

**Issue**: Module import errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Test Failures

**Issue**: "Cannot connect to database" during tests

```bash
# Ensure test database exists
# Tests use DATABASE_NAME + "_test" suffix

# Or configure test database separately in test/jest-e2e.json
```

**Issue**: "Coverage threshold not met"

```bash
# Run coverage report to see gaps
npm run test:cov

# Open coverage/lcov-report/index.html
# Add tests for uncovered code
```

### Hot Reload Not Working

**Issue**: Changes not reflected

```bash
# Restart dev server
npm run start:dev

# Check for TypeScript errors
npm run build
```

### Clear All Data and Restart

```bash
# Stop all services and remove volumes
docker-compose down -v

# Restart services
docker-compose up -d

# Wait for services to be healthy (especially Keycloak)
docker-compose ps

# Run migrations
cd apps/api
npm run migration:run

# (Optional) Seed data
npm run seed

# Start application
npm run start:dev
```

---

## Additional Resources

### Documentation

- **NestJS**: https://docs.nestjs.com/
- **TypeORM**: https://typeorm.io/
- **Keycloak**: https://www.keycloak.org/documentation
- **RabbitMQ**: https://www.rabbitmq.com/documentation.html
- **Tailwind CSS**: https://tailwindcss.com/docs

### Project Documentation

- **Specification**: `specs/001-b2b-ecommerce-platform/spec.md`
- **Implementation Plan**: `specs/001-b2b-ecommerce-platform/plan.md`
- **Data Model**: `specs/001-b2b-ecommerce-platform/data-model.md`
- **Research**: `specs/001-b2b-ecommerce-platform/research.md`
- **Tasks**: `specs/001-b2b-ecommerce-platform/tasks.md`
- **API Contracts**: `specs/001-b2b-ecommerce-platform/contracts/`

### Development Tools

- **pgAdmin** (PostgreSQL GUI): https://www.pgadmin.org/
- **Postman** (API Testing): https://www.postman.com/
- **MailHog** (Local SMTP): https://github.com/mailhog/MailHog

### Getting Help

- Check `docs/` directory for additional guides
- Review `CLAUDE.md` for AI assistant guidelines
- Open issue on project repository
- Contact team lead or senior developer

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-18  
**Maintainer**: Development Team

