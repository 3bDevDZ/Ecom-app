# B2B E-Commerce Platform API

A modern B2B e-commerce platform built with NestJS, following Clean Architecture, Domain-Driven Design (DDD), and Command Query Responsibility Segregation (CQRS) principles.

## 🏗️ Architecture

This application implements:

- **Clean Architecture**: Separation of concerns with distinct layers (Domain, Application, Infrastructure, Presentation)
- **Domain-Driven Design (DDD)**: Bounded contexts, aggregates, entities, value objects, and domain events
- **CQRS Pattern**: Separate read and write models with command and query handlers
- **Event-Driven Architecture**: Domain and integration events with RabbitMQ
- **Outbox Pattern**: Reliable event delivery with transactional consistency

## 📦 Bounded Contexts

1. **Identity** - User authentication and authorization via Keycloak
2. **Landing CMS** - Landing page content management
3. **Product Catalog** - Product management, search, and categories (10K-50K products)
4. **Order Management** - Shopping cart, order processing, and inventory reservations

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or 20.x
- Docker and Docker Compose
- PostgreSQL 15+
- RabbitMQ 3.12+
- Keycloak 23+
- MinIO (optional, for file storage)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Ecom-app/apps/api
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start infrastructure services**

From the project root:
```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- RabbitMQ on ports 5672 (AMQP) and 15672 (Management UI)
- Keycloak on port 8080
- MinIO on ports 9000 (API) and 9001 (Console)

5. **Run database migrations**
```bash
npm run migration:run
```

6. **Start the development server**
```bash
npm run start:dev
```

The API will be available at `http://localhost:3333`

## 📚 Available Scripts

### Development
- `npm run start` - Start the application
- `npm run start:dev` - Start in watch mode
- `npm run start:debug` - Start in debug mode

### Building
- `npm run build` - Build the application
- `npm run prebuild` - Clean the dist folder

### Testing
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage (90% threshold)
- `npm run test:e2e` - Run end-to-end tests

### Code Quality
- `npm run lint` - Lint and fix code
- `npm run format` - Format code with Prettier

### Database
- `npm run migration:generate` - Generate a new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert the last migration

## 🔑 Environment Variables

See `.env.example` for all available environment variables. Key variables include:

### Application
- `NODE_ENV` - Environment (development, production)
- `PORT` - API port (default: 3333)

### Database
- `DATABASE_HOST` - PostgreSQL host
- `DATABASE_PORT` - PostgreSQL port
- `DATABASE_USER` - Database user
- `DATABASE_PASSWORD` - Database password
- `DATABASE_NAME` - Database name

### Keycloak
- `KEYCLOAK_URL` - Keycloak server URL
- `KEYCLOAK_REALM` - Keycloak realm name
- `KEYCLOAK_CLIENT_ID` - Client ID
- `KEYCLOAK_CLIENT_SECRET` - Client secret

### RabbitMQ
- `RABBITMQ_URL` - RabbitMQ connection URL

### MinIO
- `MINIO_ENDPOINT` - MinIO server endpoint
- `MINIO_ACCESS_KEY` - Access key
- `MINIO_SECRET_KEY` - Secret key

## 🧪 Testing

The project maintains **90% code coverage** across all metrics:

```bash
# Run tests with coverage
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

## 📁 Project Structure

```
apps/api/src/
├── common/                 # Shared utilities
│   ├── decorators/        # Custom decorators
│   ├── filters/           # Exception filters
│   ├── interceptors/      # Request/response interceptors
│   └── pipes/             # Validation pipes
├── config/                # Configuration modules
├── modules/               # Bounded contexts
│   ├── identity/          # Authentication & authorization
│   ├── landing-cms/       # Content management
│   ├── product-catalog/   # Product management
│   └── order-management/  # Cart & orders
├── shared/                # Shared kernel
│   ├── domain/           # Base domain classes
│   ├── application/      # Base application classes
│   └── infrastructure/   # Shared infrastructure
├── views/                # Handlebars templates
├── public/               # Static assets
├── app.module.ts         # Root module
└── main.ts              # Bootstrap file
```

### Module Structure (Clean Architecture)
```
modules/{bounded-context}/
├── domain/               # Business logic layer
│   ├── aggregates/      # Aggregate roots
│   ├── entities/        # Domain entities
│   ├── value-objects/   # Value objects
│   ├── events/          # Domain events
│   └── repositories/    # Repository interfaces
├── application/         # Application logic layer
│   ├── commands/       # Command DTOs
│   ├── queries/        # Query DTOs
│   ├── handlers/       # Command/Query handlers
│   └── sagas/          # Process managers
├── infrastructure/     # Infrastructure layer
│   ├── persistence/   # Database implementation
│   ├── events/        # Event handlers
│   └── email/         # External services
└── presentation/      # Presentation layer
    ├── controllers/  # REST controllers
    └── presenters/   # Response transformers
```

## 🔐 Authentication

The application uses **Keycloak** for authentication:

1. **OAuth 2.0 Authorization Code Flow with PKCE**
2. **JWT token validation**
3. **Role-based access control** (Buyer, Seller, Admin)

### Endpoints
- `GET /api/auth/login` - Initiate login
- `GET /api/auth/callback` - OAuth callback
- `GET /api/auth/logout` - Logout

## 📡 API Documentation

Once the server is running, access the API documentation at:

- **Swagger UI**: `http://localhost:3333/api/docs`
- **Health Check**: `http://localhost:3333/health`

## 🎨 Frontend Templates

The application uses **Handlebars (HBS)** for server-side rendering with **Tailwind CSS** for styling.

Templates are located in `src/views/`:
- `templates/` - Base layouts
- `pages/` - Full page templates
- `components/` - Reusable components (atoms, molecules, organisms)

## 📊 Monitoring

### Service URLs (Development)

- **API**: http://localhost:3333
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **Keycloak Admin**: http://localhost:8080 (admin/admin)
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)
- **PostgreSQL**: localhost:5432

## 🔄 CI/CD

The project uses GitHub Actions for continuous integration:

- Linting and code quality checks
- Unit tests with coverage validation (90%)
- E2E tests with PostgreSQL and RabbitMQ
- Build verification
- Coverage reporting to Codecov

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs b2b-postgres
```

### RabbitMQ Connection Issues
```bash
# Check if RabbitMQ is running
docker ps | grep rabbitmq

# Access management UI
open http://localhost:15672
```

### Keycloak Configuration
1. Access Keycloak at http://localhost:8080
2. Import the realm: `docker/keycloak/realm-export.json`
3. Configure client secret in `.env`

## 📄 License

MIT

## 👥 Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## 📞 Support

For issues and questions, please open a GitHub issue.
