# E-commerce Order Details Page

A modern, clean Order Details Page built with **NX Monorepo**, **NestJS** (hexagonal architecture), and **React**.

## Project Structure

This is an NX monorepo with the following structure:

```
Ecom-app/
├── apps/
│   ├── api/              # NestJS Backend API
│   │   └── src/
│   │       ├── domain/           # Domain Layer (Entities, Value Objects)
│   │       ├── application/      # Application Layer (Use Cases, DTOs)
│   │       └── infrastructure/   # Infrastructure Layer (Controllers, Repositories)
│   └── web/              # React Frontend
│       └── src/
│           ├── components/       # React Components
│           ├── pages/           # Page Components
│           ├── services/        # API Services
│           └── types/           # TypeScript Types
├── libs/                 # Shared Libraries (future use)
└── CLAUDE.md            # AI Assistant Guidelines
```

## Architecture

### Backend (NestJS - Hexagonal Architecture)

The backend follows **Hexagonal Architecture** (Ports and Adapters) with **Domain-Driven Design** principles:

#### Domain Layer
- **Entities**: `Order`, `OrderItem`, `Customer`, `Document`
- **Value Objects**: `OrderStatus`, `Money`, `Address`
- **Repository Interfaces**: `IOrderRepository`

#### Application Layer
- **Use Cases**: `GetOrderDetailsUseCase`, `GetCustomerOrdersUseCase`
- **DTOs**: Data Transfer Objects for API communication

#### Infrastructure Layer
- **Controllers**: HTTP endpoints (`OrderController`)
- **Repositories**: In-memory implementation (`InMemoryOrderRepository`)

### Frontend (React + TypeScript)

The frontend is built with React and features a clean, modern design:

#### Components
- **OrderStatusTracker**: Visual progress tracker showing order status
- **OrderSummary**: Order summary with customer info and price breakdown
- **DocumentsSection**: Card-based layout for order documents
- **ProductsSection**: List of ordered items with details
- **ShippingInfo**: Shipping address and tracking information
- **PaymentInfo**: Payment method and billing details
- **SupportSection**: Customer support actions and contact info

## Features

### Order Details Page Includes:

1. **Order Status Progress Tracker**
   - Visual step-by-step progress (Placed → Processed → Shipped → Delivered)
   - Handles cancelled/refunded states
   - Responsive design

2. **Documents Section**
   - Card-based layout for each document
   - Document types: Invoice, Delivery Note, Return Label, Receipt
   - View and download actions

3. **Order Summary**
   - Order ID, date, payment method
   - Customer information
   - Price breakdown (subtotal, tax, shipping, total)

4. **Products Section**
   - Product images
   - Names, quantities, prices
   - Variant information (color, size, etc.)
   - Subtotals per item

5. **Shipping Information**
   - Delivery address
   - Shipping method
   - Tracking number with "Track Package" button
   - Estimated/actual delivery dates

6. **Payment Information**
   - Payment method
   - Transaction ID
   - Payment date
   - Billing address
   - Payment status badge

7. **Support Section**
   - Contact Support
   - Report an Issue
   - Request Return (if delivered)
   - Cancel Order (if eligible)
   - Support contact information

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm (v10+)

### Installation

```bash
# Install dependencies
npm install
```

### Running the Application

#### Start Backend API

```bash
# Development mode
npm run dev:api

# The API will run on http://localhost:3333
# API Documentation: http://localhost:3333/api/docs
```

#### Start Frontend

```bash
# Development mode
npm run dev:web

# The web app will run on http://localhost:3000
```

### Build for Production

```bash
# Build backend
npm run build:api

# Build frontend
npm run build:web
```

## API Endpoints

- `GET /api/orders/:id` - Get order details by ID
- `GET /api/orders/customer/:customerId` - Get all orders for a customer

## Technology Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **Swagger** - API documentation
- **Class Validator** - DTO validation

### Frontend
- **React** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **CSS Modules** - Scoped styling

### Monorepo
- **NX** - Smart monorepo management
- **npm** - Package manager

## Design Principles

### Clean Architecture
- Separation of concerns across layers
- Domain logic independent of frameworks
- Testable and maintainable code

### Domain-Driven Design
- Rich domain models
- Value objects for primitive obsession
- Aggregate roots for consistency

### Modern UI/UX
- Clean, minimal design
- Card-based layouts
- Responsive for mobile and desktop
- Accessible components
- Print-friendly styles

## Mock Data

The application comes with pre-seeded mock data:
- Order ID: `ORD-2024-001`
- Customer: John Doe
- 2 products with variants
- 3 documents (Invoice, Delivery Note, Return Label)
- Complete shipping and payment information

## Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Authentication & Authorization
- [ ] Real-time order tracking
- [ ] Email notifications
- [ ] Order history and search
- [ ] Admin dashboard
- [ ] Payment gateway integration
- [ ] Multi-language support
- [ ] Dark mode

## Contributing

Follow the guidelines in `CLAUDE.md` for development best practices.

## License

MIT

---

**Built with ❤️ using NX, NestJS, and React**
