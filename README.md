# B2B E-Commerce API

A B2B E-Commerce Platform API built with NestJS, featuring Clean Architecture, Domain-Driven Design (DDD), and CQRS patterns.

## Architecture

- **Clean Architecture** with clear separation of concerns
- **Domain-Driven Design (DDD)** for complex business logic
- **CQRS** (Command Query Responsibility Segregation) pattern
- **Event-Driven Architecture** with outbox pattern for reliable messaging
- **TypeORM** for database persistence with PostgreSQL
- **Keycloak** for authentication and authorization

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** NestJS 10
- **Language:** TypeScript 5.3
- **Database:** PostgreSQL 15
- **Cache/Message Broker:** Redis 7, RabbitMQ
- **Authentication:** Keycloak + JWT
- **Testing:** Jest
- **Package Manager:** pnpm

## Project Structure

```
├── src/                          # Source code
│   ├── common/                   # Shared utilities, decorators, filters
│   ├── config/                   # Configuration files
│   ├── modules/                  # Feature modules
│   │   ├── identity/            # Authentication & authorization
│   │   ├── product-catalog/     # Product management
│   │   ├── order-management/    # Order processing
│   │   └── landing-cms/         # Landing page content
│   ├── shared/                  # Shared domain and infrastructure
│   │   ├── domain/              # Base domain entities and value objects
│   │   └── infrastructure/      # Database and messaging infrastructure
│   └── migrations/              # Database migrations
├── test/                        # Test files
│   ├── e2e/                     # End-to-end tests
│   ├── integration/             # Integration tests
│   ├── unit/                    # Unit tests
│   └── helpers/                 # Test utilities
├── dist/                        # Compiled JavaScript files
├── .env.example                 # Environment variables template
├── jest.config.js               # Jest configuration
├── nest-cli.json                # NestJS CLI configuration
├── tsconfig.json                # TypeScript configuration
└── webpack.config.js            # Webpack configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm
- PostgreSQL 15
- Redis 7
- RabbitMQ
- Keycloak

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Copy environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`

### Development

Start the development server:
```bash
pnpm run start:dev
```

The API will be available at `http://localhost:3000`

### Build

Build for production:
```bash
pnpm run build
```

### Testing

Run unit tests:
```bash
pnpm test
```

Run tests with coverage:
```bash
pnpm run test:cov
```

Run end-to-end tests:
```bash
pnpm run test:e2e
```

### Database Migrations

Generate a new migration:
```bash
pnpm run migration:generate -- -n MigrationName
```

Run migrations:
```bash
pnpm run migration:run
```

Revert migrations:
```bash
pnpm run migration:revert
```

## Features

- **Product Catalog Management** with categories, variants, and inventory
- **Order Processing** with status tracking
- **User Authentication** via Keycloak
- **RESTful API** with comprehensive endpoints
- **Real-time Notifications** via WebSocket
- **Event-Driven Architecture** for scalable message processing
- **Comprehensive Testing** with Jest

## API Documentation

The API provides REST endpoints for:
- Authentication & User Management
- Product Catalog Management
- Order Management
- Landing Page Content Management

## Contributing

1. Follow the established coding standards
2. Write comprehensive tests
3. Ensure all tests pass
4. Update documentation as needed

## License

MIT License
