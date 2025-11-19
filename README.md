# B2B E-Commerce Platform - Nx Monorepo

A modern B2B e-commerce platform built with NestJS in an Nx monorepo, following Clean Architecture, Domain-Driven Design (DDD), and Command Query Responsibility Segregation (CQRS) principles.

## 🏗️ Monorepo Structure

This is an **Nx monorepo** that enables:
- ✅ Fast, incremental builds
- ✅ Computational caching
- ✅ Task orchestration and dependency management
- ✅ Code sharing across applications
- ✅ Consistent development experience

```
ecom-app/
├── apps/
│   └── api/                    # NestJS Backend API
├── libs/                       # Shared libraries (future)
├── docker/                     # Docker configurations
├── specs/                      # Project specifications
├── nx.json                     # Nx configuration
├── tsconfig.base.json          # Base TypeScript configuration
└── package.json                # Root package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or 20.x
- npm or pnpm
- Docker and Docker Compose
- Nx CLI (optional): `npm install -g nx`

### Installation

1. **Install dependencies**
```bash
npm install
# or
pnpm install
```

2. **Start infrastructure services**
```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- RabbitMQ on ports 5672 (AMQP) and 15672 (Management UI)
- Keycloak on port 8080
- MinIO on ports 9000 (API) and 9001 (Console)

3. **Run database migrations**
```bash
npm run migration:run
```

4. **Start the development server**
```bash
npm run start:dev
```

The API will be available at `http://localhost:3333`

## 📦 Applications

### API (`apps/api`)

NestJS backend application with:
- **4 Bounded Contexts**: Identity, Landing CMS, Product Catalog, Order Management
- **Clean Architecture**: Domain, Application, Infrastructure, Presentation layers
- **CQRS Pattern**: Separate read/write models
- **Event-Driven**: Domain events with RabbitMQ
- **Outbox Pattern**: Reliable event delivery
- **Keycloak Auth**: OAuth 2.0 with PKCE
- **Server-Side Rendering**: Handlebars + Tailwind CSS

[See API README](apps/api/README.md) for detailed documentation.

## 🛠️ Nx Commands

### Development

```bash
# Serve the API in development mode
npm run start:dev
# or
nx serve api

# Build the API
npm run build
# or
nx build api

# Build all applications
npm run build:all
# or
nx run-many --target=build --all
```

### Testing

```bash
# Run tests for API
npm run test
# or
nx test api

# Run tests with coverage
npm run test:cov
# or
nx test api --coverage

# Run E2E tests
npm run test:e2e
# or
nx e2e api

# Run tests for all projects
npm run test:all
# or
nx run-many --target=test --all
```

### Linting & Formatting

```bash
# Lint the API
npm run lint
# or
nx lint api

# Lint all projects
npm run lint:all
# or
nx run-many --target=lint --all

# Format code
npm run format
# or
nx format:write

# Check formatting
npm run format:check
# or
nx format:check
```

### Affected Commands

Nx can run commands only on projects affected by your changes:

```bash
# Build only affected projects
npm run affected:build
# or
nx affected --target=build

# Test only affected projects
npm run affected:test
# or
nx affected --target=test

# Lint only affected projects
npm run affected:lint
# or
nx affected --target=lint
```

### Database Migrations

```bash
# Run migrations
npm run migration:run
# or
nx run api:migration:run

# Generate a new migration
npm run migration:generate
# or
nx run api:migration:generate

# Revert last migration
npm run migration:revert
# or
nx run api:migration:revert
```

### Dependency Graph

Visualize your project's dependency graph:

```bash
# View full dependency graph
npm run dep-graph
# or
nx dep-graph

# View affected dependency graph
npm run affected:dep-graph
# or
nx affected:dep-graph
```

## 📊 Project Graph

Nx maintains a project graph that understands the dependencies between your projects. This enables:

- **Smart rebuilds**: Only rebuild what changed
- **Parallel execution**: Run multiple tasks simultaneously
- **Distributed caching**: Share build artifacts across machines
- **Affected commands**: Only test/build what's affected by your changes

## 🏛️ Architecture

### Clean Architecture Layers

```
modules/{bounded-context}/
├── domain/               # Business logic
│   ├── aggregates/      # Aggregate roots
│   ├── entities/        # Domain entities
│   ├── value-objects/   # Value objects
│   ├── events/          # Domain events
│   └── repositories/    # Repository interfaces
├── application/         # Use cases
│   ├── commands/       # Command DTOs
│   ├── queries/        # Query DTOs
│   ├── handlers/       # Command/Query handlers
│   └── sagas/          # Process managers
├── infrastructure/     # External concerns
│   ├── persistence/   # Database implementation
│   ├── events/        # Event handlers
│   └── email/         # External services
└── presentation/      # API layer
    ├── controllers/  # REST controllers
    └── presenters/   # Response transformers
```

### Key Patterns

- **Domain-Driven Design (DDD)**: Bounded contexts, aggregates, entities, value objects
- **CQRS**: Separate read and write models
- **Event Sourcing**: Domain events for state changes
- **Outbox Pattern**: Reliable event delivery
- **Repository Pattern**: Data access abstraction
- **Unit of Work**: Transaction management

## 🔐 Authentication

Authentication is handled by **Keycloak**:

1. OAuth 2.0 Authorization Code Flow with PKCE
2. JWT token validation
3. Role-based access control (Buyer, Seller, Admin)
4. Session management

### Endpoints
- `GET /api/auth/login` - Initiate login
- `GET /api/auth/callback` - OAuth callback
- `GET /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get user profile

## 📡 API Documentation

Once running, access:

- **Swagger UI**: http://localhost:3333/api/docs
- **Health Check**: http://localhost:3333/health

## 🐳 Docker Services

Development services (via docker-compose):

- **API**: http://localhost:3333
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **Keycloak Admin**: http://localhost:8080 (admin/admin)
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)
- **PostgreSQL**: localhost:5432

## 🧪 Testing

The project maintains **90% code coverage**:

```bash
# Run all tests with coverage
npm run test:cov

# Coverage thresholds (enforced):
# - Branches: 90%
# - Functions: 90%
# - Lines: 90%
# - Statements: 90%
```

### Test Structure
```
test/
├── unit/          # Unit tests for domain logic
├── integration/   # Integration tests for services
├── e2e/           # End-to-end tests for APIs
├── factories/     # Test data factories
└── helpers/       # Test utilities
```

## 🔄 CI/CD

GitHub Actions workflow includes:

- ✅ Linting and code quality checks
- ✅ Unit tests with coverage validation (90%)
- ✅ E2E tests with PostgreSQL and RabbitMQ
- ✅ Build verification
- ✅ Coverage reporting to Codecov

## 📚 Documentation

- [API Documentation](apps/api/README.md)
- [Project Specification](specs/001-b2b-ecommerce-platform/spec.md)
- [Implementation Plan](specs/001-b2b-ecommerce-platform/plan.md)
- [Tasks Breakdown](specs/001-b2b-ecommerce-platform/tasks.md)
- [Data Model](specs/001-b2b-ecommerce-platform/data-model.md)
- [Quick Start Guide](specs/001-b2b-ecommerce-platform/quickstart.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm run test`
4. Run linting: `npm run lint`
5. Format code: `npm run format`
6. Submit a pull request

## 📄 License

MIT

## 🆘 Troubleshooting

### Nx Cache Issues

If you encounter caching issues:

```bash
# Clear Nx cache
nx reset
```

### Build Issues

```bash
# Clean build artifacts
rm -rf dist
rm -rf node_modules/.cache

# Rebuild
npm run build
```

### Database Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View logs
docker logs b2b-postgres

# Restart database
docker-compose restart postgres
```

## 🎯 Next Steps

- [ ] Add more applications to the monorepo
- [ ] Create shared libraries for common functionality
- [ ] Set up Nx Cloud for distributed caching
- [ ] Implement workspace generators
- [ ] Add mobile app (React Native)
- [ ] Add admin dashboard (React/Next.js)

