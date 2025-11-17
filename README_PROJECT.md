# E-commerce Order Details Page

A modern, clean Order Details Page built with **NX Monorepo** and **NestJS** using **Handlebars templating engine** with **hexagonal architecture**.

## Project Structure

This is an NX monorepo with integrated frontend and backend:

```
Ecom-app/
├── apps/
│   └── api/              # NestJS Application (Backend + Frontend)
│       ├── src/
│       │   ├── domain/           # Domain Layer (Entities, Value Objects)
│       │   ├── application/      # Application Layer (Use Cases, DTOs)
│       │   └── infrastructure/   # Infrastructure Layer (Controllers, Repositories, Helpers)
│       ├── views/                # Handlebars Templates
│       │   ├── layouts/         # Layout templates
│       │   ├── partials/        # Reusable template partials
│       │   └── *.hbs            # Page templates
│       └── public/              # Static Assets (CSS, JS, Images)
│           ├── css/
│           ├── js/
│           └── images/
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
- **Controllers**: HTTP endpoints (`OrderController`, `ViewController`)
- **Repositories**: In-memory implementation (`InMemoryOrderRepository`)
- **Helpers**: Handlebars helpers for template rendering

### Frontend (Handlebars + CSS)

The frontend is server-side rendered using Handlebars templates with clean, modern CSS:

#### Template Partials
- **order-status-tracker**: Visual progress tracker showing order status
- **order-summary**: Order summary with customer info and price breakdown
- **documents-section**: Card-based layout for order documents
- **products-section**: List of ordered items with details
- **shipping-info**: Shipping address and tracking information
- **payment-info**: Payment method and billing details
- **support-section**: Customer support actions and contact info

#### View Controller
- Handles server-side rendering of pages
- Integrates with use cases to fetch order data
- Prepares data for template rendering

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
npm install --legacy-peer-deps
```

### Running the Application

```bash
# Development mode
npm run dev

# The application will run on http://localhost:3333
```

Visit:
- **Order Details Page**: http://localhost:3333/orders/ORD-2024-001
- **API Documentation**: http://localhost:3333/api/docs
- **Home (Demo Order)**: http://localhost:3333/

### Build for Production

```bash
# Build application
npm run build

# Start production server
npm start
```

## Routes

### Web Pages (Server-Side Rendered)
- `GET /` - Home page (demo order)
- `GET /orders/:id` - Order details page

### API Endpoints (JSON)
- `GET /api/orders/:id` - Get order details by ID (JSON)
- `GET /api/orders/customer/:customerId` - Get all orders for a customer (JSON)

## Technology Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **Swagger** - API documentation
- **Class Validator** - DTO validation

### View Layer
- **Handlebars (hbs)** - Server-side templating engine
- **CSS** - Clean, modern styling
- **Express** - Static file serving

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
- Server-side rendering for performance

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
- [ ] Progressive Web App (PWA)

## Contributing

Follow the guidelines in `CLAUDE.md` for development best practices.

## License

MIT

---

**Built with ❤️ using NX, NestJS, and Handlebars**
