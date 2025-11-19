# Database Setup Guide

This guide will help you set up the PostgreSQL database for the B2B E-Commerce Platform, especially if you're new to the project.

## 🚀 Quick Start (Recommended for Newcomers)

### 1. Automated Setup

Run the automated setup script:

```bash
npm run db:setup
```

This script will:
- Check Docker availability
- Start all required services (PostgreSQL, Keycloak, RabbitMQ, MinIO)
- Verify database setup
- Guide you through running migrations
- Offer to start the application

### 2. Verify Setup

Check that everything is working:

```bash
npm run db:check
```

## 📋 Manual Setup (If you prefer step-by-step control)

### Prerequisites

Make sure you have:
- [Docker](https://www.docker.com/get-started) installed and running
- [Docker Compose](https://docs.docker.com/compose/install/) installed
- [Node.js](https://nodejs.org/) with npm installed

### Step 1: Configure Environment

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Update `.env` with your preferred settings (or use the defaults)

### Step 2: Start Docker Services

```bash
# Start all services
npm run docker:up

# Or start only specific services
docker-compose up -d postgres keycloak rabbitmq minio
```

### Step 3: Verify Database Setup

```bash
npm run db:check
```

You should see green checkmarks for:
- ✅ PostgreSQL container is running
- ✅ Database 'b2b_ecommerce' exists
- ✅ Database 'keycloak' exists
- ✅ Extension 'uuid-ossp' is installed
- ✅ Extension 'pg_trgm' is installed
- ✅ Extension 'unaccent' is installed
- ✅ User 'ecommerce' has proper privileges
- ✅ Database connectivity test passed

### Step 4: Run Database Migrations

```bash
npm run migration:run
```

## 🔧 Common Tasks

### Connect to Database

```bash
# Direct PostgreSQL connection
npm run db:connect

# Using psql with connection details
docker exec -it b2b-ecommerce-postgres psql -U ecommerce -d b2b_ecommerce
```

### Check Database Logs

```bash
npm run docker:logs
```

### Restart Database

```bash
npm run docker:restart
```

### Reset Database (⚠️ This deletes all data!)

```bash
npm run db:reset
```

## 🗄️ Database Information

### Connection Details

| Parameter | Value |
|-----------|-------|
| Host | localhost |
| Port | 5432 |
| Database | b2b_ecommerce |
| Username | ecommerce |
| Password | ecommerce_password |

### Connection URL

```
postgresql://ecommerce:ecommerce_password@localhost:5432/b2b_ecommerce
```

### Available Databases

- `b2b_ecommerce` - Main application database
- `keycloak` - Keycloak identity provider database

### Installed Extensions

- `uuid-ossp` - Generate unique identifiers
- `pg_trgm` - Text similarity search
- `unaccent` - Text search normalization

## 🐛 Troubleshooting

### PostgreSQL Container Not Starting

1. Check Docker daemon is running:
```bash
docker info
```

2. Check for port conflicts:
```bash
netstat -an | grep 5432
```

3. View container logs:
```bash
docker logs b2b-ecommerce-postgres
```

### Database Connection Failed

1. Verify container is running:
```bash
docker ps | grep postgres
```

2. Check container health:
```bash
docker-compose ps postgres
```

3. Test connection manually:
```bash
docker exec b2b-ecommerce-postgres pg_isready -U ecommerce
```

### Migration Errors

1. Check database connectivity:
```bash
npm run db:check
```

2. Verify migrations exist:
```bash
ls -la src/migrations/
```

3. Run migrations with verbose output:
```bash
npm run migration:run -- --verbose
```

### Permission Errors

1. Check user privileges:
```bash
docker exec b2b-ecommerce-postgres psql -U ecommerce -d b2b_ecommerce -c "SELECT rolname, rolsuper FROM pg_roles WHERE rolname = 'ecommerce';"
```

2. Reset database if needed:
```bash
npm run db:reset
```

## 📚 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Setup Database | `npm run db:setup` | Complete automated setup |
| Check Database | `npm run db:check` | Verify database setup |
| Connect Database | `npm run db:connect` | Open PostgreSQL shell |
| Reset Database | `npm run db:reset` | Drop and recreate all data |
| Start Docker | `npm run docker:up` | Start all Docker services |
| Stop Docker | `npm run docker:down` | Stop all Docker services |
| View Logs | `npm run docker:logs` | View PostgreSQL logs |
| Restart Database | `npm run docker:restart` | Restart PostgreSQL container |
| Run Migrations | `npm run migration:run` | Execute database migrations |

## 🏗️ Architecture Overview

```mermaid
graph TD
    A[Application] --> B[TypeORM]
    B --> C[PostgreSQL]
    D[Keycloak] --> C
    E[RabbitMQ] --> C
    F[MinIO] --> G[S3 API]
    
    C --> H[b2b_ecommerce]
    C --> I[keycloak]
    
    J[Docker Container] --> C
    K[Docker Volume] --> C
```

## 🤝 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Run `npm run db:check` for diagnostics
3. Check container logs: `npm run docker:logs`
4. Review the main [README.md](./README.md) for additional setup information

## 📝 Next Steps

After setting up the database:

1. ✅ Run migrations: `npm run migration:run`
2. ✅ Start the application: `npm run start:dev`
3. ✅ Test API endpoints: `curl http://localhost:3000/health`
4. ✅ Explore the codebase and documentation

---

**Happy coding! 🚀**
