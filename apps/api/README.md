# B2B E-Commerce Platform API

A comprehensive B2B e-commerce platform built with Clean Architecture, Domain-Driven Design (DDD), and CQRS patterns using NestJS.

## Features

### MVP (Phase 1)
- **Product Catalog**: Browse, search, and filter products with variant support
- **Shopping Cart**: Add products to cart with session persistence
- **Checkout & Orders**: Complete checkout and place orders (offline payment/fulfillment)
- **Order Management**: View order history, track orders, and reorder
- **Landing Page CMS**: Fully editable landing page content for administrators
- **Authentication**: Keycloak integration for secure user authentication

### Architecture

- **Clean Architecture**: Separation of concerns with clear dependency rules
- **Domain-Driven Design**: Bounded contexts with aggregates, entities, and value objects
- **CQRS**: Separate read and write models for optimized performance
- **Event-Driven**: Outbox pattern for reliable event publishing to RabbitMQ
- **Test-Driven**: 90% code coverage target with unit, integration, and E2E tests

## Prerequisites

- **Node.js**: 18.x or higher
- **PostgreSQL**: 15.x or higher
- **RabbitMQ**: 3.12.x or higher
- **Keycloak**: 22.x or higher
- **pnpm**: 8.x or higher (recommended) or npm

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Configuration

Copy the example environment file and configure your local settings:

```bash
cp .env.example .env
```

Edit `.env` and update the following:
- Database credentials
- Keycloak URL and client configuration
- RabbitMQ connection details
- SMTP settings for email notifications

### 3. Database Setup

Ensure PostgreSQL is running and create the database:

```bash
createdb b2b_ecommerce
```

Run database migrations:

```bash
pnpm run migration:run
```

### 4. Start External Services

#### Keycloak
```bash
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:23.0 start-dev
```

#### RabbitMQ
```bash
docker run -d -p 5672:5672 -p 15672:15672 --name rabbitmq rabbitmq:3-management
```

### 5. Run the Application

#### Development Mode
```bash
pnpm run start:dev
```

#### Production Mode
```bash
pnpm run build
pnpm run start:prod
```

The API will be available at `http://localhost:3000`

## Testing

### Run All Tests
```bash
pnpm run test
```

### Run Tests with Coverage
```bash
pnpm run test:cov
```

### Run E2E Tests
```bash
pnpm run test:e2e
```

### Watch Mode
```bash
pnpm run test:watch
```

## Project Structure

```
apps/api/src/
├── common/              # Cross-cutting concerns
│   ├── decorators/      # Custom decorators
│   ├── filters/         # Exception filters
│   ├── interceptors/    # Logging, transformation
│   └── pipes/           # Validation pipes
├── config/              # Configuration modules
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── keycloak.config.ts
│   └── rabbitmq.config.ts
├── modules/             # Bounded Contexts
│   ├── identity/        # Authentication & user management
│   ├── landing-cms/     # Landing page content management
│   ├── order-management/# Orders and cart management
│   └── product-catalog/ # Product browsing and search
├── shared/              # Shared kernel
│   ├── domain/          # Base domain classes
│   ├── application/     # Base CQRS classes
│   └── infrastructure/  # Outbox, messaging, database
├── views/               # Handlebars templates (Atomic Design)
│   ├── components/      # Reusable components
│   ├── pages/           # Full page templates
│   └── templates/       # Layout templates
├── app.module.ts        # Root module
└── main.ts              # Application bootstrap
```

## Bounded Contexts

### 1. Product Catalog
- **Domain**: Products, Categories, Variants, Inventory
- **Features**: Search, filtering, variant selection
- **API**: `/api/products`, `/api/categories`

### 2. Order Management
- **Domain**: Orders, Carts, Order Items
- **Features**: Cart management, checkout, order history
- **API**: `/api/cart`, `/api/orders`

### 3. Landing CMS
- **Domain**: Landing page content sections
- **Features**: Edit hero, trust logos, product showcase, footer
- **API**: `/api/cms/landing/*`

### 4. Identity
- **Domain**: User profiles (synced from Keycloak)
- **Features**: Authentication, authorization
- **API**: `/api/auth/*`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run build` | Build the application |
| `pnpm run start` | Start the application |
| `pnpm run start:dev` | Start in watch mode |
| `pnpm run start:debug` | Start in debug mode |
| `pnpm run start:prod` | Start production build |
| `pnpm run lint` | Lint and fix code |
| `pnpm run format` | Format code with Prettier |
| `pnpm run test` | Run unit tests |
| `pnpm run test:cov` | Run tests with coverage |
| `pnpm run test:e2e` | Run E2E tests |
| `pnpm run migration:generate` | Generate new migration |
| `pnpm run migration:run` | Run pending migrations |
| `pnpm run migration:revert` | Revert last migration |

## API Documentation

Once the application is running, access the API documentation at:
- Swagger UI: `http://localhost:3000/api/docs`

## Development Guidelines

### Testing Strategy
- **Unit Tests**: Test domain logic (aggregates, value objects, domain services)
- **Integration Tests**: Test repositories, event handlers, external integrations
- **E2E Tests**: Test complete user journeys (browse → cart → checkout → orders)
- **Target Coverage**: 90% minimum

### Commit Conventions
Follow conventional commits:
- `feat: add new feature`
- `fix: bug fix`
- `docs: documentation changes`
- `test: add or update tests`
- `refactor: code refactoring`

### Code Style
- ESLint and Prettier are configured and enforced
- Run `pnpm run lint` before committing
- Run `pnpm run format` to auto-format code

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `pg_isready`
- Check database credentials in `.env`
- Verify database exists: `psql -l`

### Keycloak Authentication Errors
- Verify Keycloak is running: `curl http://localhost:8080`
- Check realm and client configuration
- Ensure client secret matches `.env`

### RabbitMQ Connection Issues
- Verify RabbitMQ is running: `curl http://localhost:15672`
- Check RabbitMQ credentials in `.env`
- Access management UI: `http://localhost:15672` (guest/guest)

## Performance Considerations

- **Search Performance**: Product search uses PostgreSQL full-text search with indexed queries (target: <2s for 95% of searches)
- **Caching**: Implement Redis caching for frequently accessed product catalog queries
- **Inventory Reservation**: Uses row-level locking to prevent overselling
- **Event Processing**: Outbox pattern ensures reliable event delivery without blocking requests

## Contributing

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Write tests first (TDD approach)
3. Implement the feature
4. Ensure all tests pass: `pnpm run test:cov`
5. Ensure lint passes: `pnpm run lint`
6. Commit changes: `git commit -m "feat: your feature description"`
7. Push to branch: `git push origin feat/your-feature`
8. Create a Pull Request

## License

MIT

## Support

For questions or issues, please create an issue in the GitHub repository.
