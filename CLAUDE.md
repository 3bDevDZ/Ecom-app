# CLAUDE.md - AI Assistant Guide for Ecom-app

## Project Overview

**Ecom-app** is an e-commerce application repository. This document provides comprehensive guidance for AI assistants working with this codebase.

**Repository**: 3bDevDZ/Ecom-app
**Current State**: Initial setup phase
**Last Updated**: 2025-11-16

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Technology Stack](#technology-stack)
3. [Development Workflow](#development-workflow)
4. [Code Conventions](#code-conventions)
5. [Common Tasks](#common-tasks)
6. [Testing Guidelines](#testing-guidelines)
7. [Security Considerations](#security-considerations)
8. [Deployment](#deployment)
9. [AI Assistant Guidelines](#ai-assistant-guidelines)

---

## Project Structure

### Expected Directory Layout

```
Ecom-app/
├── .git/                   # Git repository
├── .github/               # GitHub workflows and templates
│   └── workflows/         # CI/CD pipelines
├── src/                   # Source code
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components/routes
│   ├── services/         # Business logic and API services
│   ├── utils/            # Utility functions
│   ├── hooks/            # Custom React hooks (if React)
│   ├── store/            # State management
│   ├── types/            # TypeScript type definitions
│   └── config/           # Configuration files
├── public/               # Static assets
├── tests/                # Test files
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/             # End-to-end tests
├── docs/                # Documentation
├── scripts/             # Build and utility scripts
├── package.json         # Node.js dependencies
├── tsconfig.json        # TypeScript configuration
├── .env.example         # Environment variables template
├── .gitignore          # Git ignore rules
├── README.md           # Project documentation
└── CLAUDE.md           # This file

Backend (if applicable):
├── server/
│   ├── controllers/     # Request handlers
│   ├── models/         # Data models
│   ├── routes/         # API routes
│   ├── middleware/     # Express middleware
│   ├── services/       # Business logic
│   └── utils/          # Server utilities
```

---

## Technology Stack

### Recommended Technologies

**Frontend:**
- React/Next.js or Vue/Nuxt.js for UI framework
- TypeScript for type safety
- Tailwind CSS or styled-components for styling
- Redux/Zustand/Context API for state management
- React Query or SWR for data fetching
- React Hook Form for form handling
- Zod or Yup for validation

**Backend:**
- Node.js with Express or NestJS
- PostgreSQL or MongoDB for database
- Prisma or TypeORM for ORM
- JWT for authentication
- Stripe/PayPal for payment processing
- Redis for caching

**Testing:**
- Jest for unit testing
- React Testing Library for component testing
- Cypress or Playwright for E2E testing
- Supertest for API testing

**DevOps:**
- Docker for containerization
- GitHub Actions for CI/CD
- ESLint + Prettier for code quality
- Husky for git hooks

---

## Development Workflow

### Branch Strategy

- **main/master**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: Feature branches (e.g., `feature/user-authentication`)
- **bugfix/**: Bug fix branches (e.g., `bugfix/cart-calculation`)
- **hotfix/**: Urgent production fixes
- **claude/**: AI assistant working branches

### Commit Message Convention

Follow Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples:**
```
feat(auth): add user login functionality
fix(cart): correct total price calculation
docs(api): update API endpoint documentation
```

### Git Workflow

1. **Create feature branch** from develop
2. **Develop and commit** changes incrementally
3. **Test thoroughly** before pushing
4. **Push to remote** with descriptive commits
5. **Create Pull Request** for code review
6. **Merge after approval** and testing

---

## Code Conventions

### General Principles

1. **KISS** (Keep It Simple, Stupid)
2. **DRY** (Don't Repeat Yourself)
3. **SOLID** principles for OOP
4. **Clean Code** practices
5. **Defensive programming** for e-commerce reliability

### TypeScript/JavaScript

```typescript
// Use meaningful variable names
const userShoppingCart = []; // Good
const arr = []; // Bad

// Use const by default, let when needed, never var
const TAX_RATE = 0.08;
let cartTotal = 0;

// Use async/await over promises
async function fetchProducts() {
  try {
    const response = await api.get('/products');
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

// Use destructuring
const { userId, email } = user;

// Use template literals
const greeting = `Welcome, ${user.name}!`;

// Use optional chaining
const city = user?.address?.city;

// Use nullish coalescing
const displayName = user.name ?? 'Guest';
```

### Component Structure (React Example)

```typescript
import React from 'react';
import { ComponentProps } from './types';
import styles from './Component.module.css';

interface ComponentProps {
  title: string;
  onAction?: () => void;
}

export const Component: React.FC<ComponentProps> = ({
  title,
  onAction
}) => {
  // Hooks at the top
  const [state, setState] = useState();

  // Event handlers
  const handleClick = () => {
    // Implementation
  };

  // Render
  return (
    <div className={styles.container}>
      <h1>{title}</h1>
    </div>
  );
};
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `ProductCard.tsx`)
- **Utilities**: camelCase (e.g., `formatCurrency.ts`)
- **Types**: PascalCase with `.types.ts` (e.g., `User.types.ts`)
- **Tests**: Match source with `.test.ts` or `.spec.ts`
- **Styles**: Match component (e.g., `ProductCard.module.css`)

### API Design

```typescript
// RESTful conventions
GET    /api/products        // List all products
GET    /api/products/:id    // Get single product
POST   /api/products        // Create product
PUT    /api/products/:id    // Update product
PATCH  /api/products/:id    // Partial update
DELETE /api/products/:id    // Delete product

// Response format
{
  "success": true,
  "data": { },
  "error": null,
  "meta": {
    "timestamp": "2025-11-16T00:00:00Z",
    "page": 1,
    "total": 100
  }
}
```

---

## Common Tasks

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/3bDevDZ/Ecom-app.git
cd Ecom-app

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- ProductCard.test.tsx

# Run with coverage
npm test -- --coverage

# E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

### Build and Deploy

```bash
# Production build
npm run build

# Start production server
npm start

# Build Docker image
docker build -t ecom-app .

# Run Docker container
docker run -p 3000:3000 ecom-app
```

---

## Testing Guidelines

### Test Coverage Goals

- **Unit Tests**: 80%+ coverage for business logic
- **Integration Tests**: Critical user flows
- **E2E Tests**: Complete checkout process

### Testing Best Practices

1. **AAA Pattern**: Arrange, Act, Assert
2. **Test behavior**, not implementation
3. **Mock external dependencies**
4. **Use descriptive test names**
5. **Test edge cases** and error conditions

```typescript
describe('ProductCard', () => {
  it('should display product name and price', () => {
    const product = { name: 'Test Product', price: 29.99 };
    render(<ProductCard product={product} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('should call onAddToCart when button is clicked', () => {
    const handleAddToCart = jest.fn();
    const product = { id: 1, name: 'Test', price: 29.99 };
    render(<ProductCard product={product} onAddToCart={handleAddToCart} />);

    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(handleAddToCart).toHaveBeenCalledWith(product);
  });
});
```

---

## Security Considerations

### Critical Security Practices for E-commerce

1. **Authentication & Authorization**
   - Use JWT tokens with secure expiration
   - Implement refresh token rotation
   - Use bcrypt for password hashing (min 10 rounds)
   - Implement rate limiting on auth endpoints

2. **Payment Security**
   - **NEVER** store credit card numbers
   - Use PCI-compliant payment providers (Stripe, PayPal)
   - Implement server-side payment validation
   - Use HTTPS for all transactions

3. **Data Protection**
   - Encrypt sensitive data at rest
   - Use environment variables for secrets
   - Never commit `.env` files
   - Sanitize all user inputs
   - Implement CSRF protection

4. **Input Validation**
   - Validate on both client and server
   - Use parameterized queries (prevent SQL injection)
   - Sanitize HTML to prevent XSS
   - Validate file uploads strictly

5. **API Security**
   - Implement request rate limiting
   - Use CORS appropriately
   - Validate JWT tokens on every request
   - Log security events

```typescript
// Example: Input sanitization
import DOMPurify from 'dompurify';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().positive(),
  description: z.string().max(2000),
});

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input);
}
```

---

## Deployment

### Environment Variables

```bash
# .env.example
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@localhost:5432/ecom
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
API_URL=https://api.ecom-app.com
FRONTEND_URL=https://ecom-app.com
```

### Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Static assets optimized
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Error monitoring setup (Sentry, LogRocket)
- [ ] Performance monitoring enabled
- [ ] Backup strategy in place
- [ ] Security headers configured

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npm run deploy
```

---

## AI Assistant Guidelines

### When Working on This Project

#### 1. Always Check First
- Read existing code before making changes
- Check for existing patterns and conventions
- Look for similar implementations
- Verify dependencies and versions

#### 2. Security First
- **CRITICAL**: Never compromise on security for e-commerce
- Validate all user inputs
- Use parameterized queries
- Never expose sensitive data in logs or responses
- Follow OWASP Top 10 guidelines

#### 3. Code Quality
- Write TypeScript with proper types (avoid `any`)
- Add JSDoc comments for complex functions
- Keep functions small and focused (max 20-30 lines)
- Extract reusable logic into utilities
- Follow existing naming conventions

#### 4. Testing
- Write tests for new features
- Update tests when modifying code
- Ensure tests pass before committing
- Test edge cases and error conditions

#### 5. Documentation
- Update README when adding features
- Document API changes
- Add inline comments for complex logic
- Keep CLAUDE.md updated with learnings

#### 6. Git Practices
- Make atomic commits (one logical change per commit)
- Write descriptive commit messages
- Push to claude/* branches
- Never force push to main/develop
- Keep commits focused and reviewable

#### 7. Performance
- Optimize database queries (use indexes)
- Implement pagination for lists
- Lazy load images and components
- Cache frequently accessed data
- Monitor bundle size

#### 8. Accessibility
- Use semantic HTML
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers
- Maintain color contrast ratios

#### 9. Error Handling
- Always handle errors gracefully
- Provide user-friendly error messages
- Log errors for debugging
- Never expose stack traces to users
- Implement proper error boundaries (React)

#### 10. Before Committing
- [ ] Code linted and formatted
- [ ] All tests passing
- [ ] No console.logs or debug code
- [ ] Types are properly defined
- [ ] Comments added where needed
- [ ] No sensitive data in code
- [ ] Performance impact considered
- [ ] Accessibility maintained

### Preferred Patterns

#### State Management
```typescript
// Use Context API for global state
export const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
```

#### Error Handling
```typescript
// Custom error classes
class PaymentError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

// Error boundary wrapper
const withErrorBoundary = (Component: React.FC) => (props: any) => (
  <ErrorBoundary>
    <Component {...props} />
  </ErrorBoundary>
);
```

#### API Calls
```typescript
// Centralized API client
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const productService = {
  getAll: () => api.get('/products'),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: Product) => api.post('/products', data),
};
```

### Common Pitfalls to Avoid

1. ❌ **Don't** store sensitive data in localStorage
2. ❌ **Don't** use `any` type in TypeScript
3. ❌ **Don't** ignore error handling
4. ❌ **Don't** commit API keys or secrets
5. ❌ **Don't** skip validation on backend
6. ❌ **Don't** trust client-side validation alone
7. ❌ **Don't** make breaking changes without discussion
8. ❌ **Don't** optimize prematurely
9. ❌ **Don't** ignore accessibility
10. ❌ **Don't** push directly to main branch

### Questions to Ask Before Implementing

1. Does this align with existing patterns?
2. Is this secure for an e-commerce application?
3. Have I handled all error cases?
4. Is this testable?
5. Will this scale with more users/products?
6. Is this accessible?
7. Am I following the project's conventions?
8. Have I checked for existing implementations?

---

## Additional Resources

### E-commerce Specific Considerations

1. **Product Management**
   - Inventory tracking
   - Product variants (size, color, etc.)
   - Product images optimization
   - SEO-friendly URLs and metadata

2. **Shopping Cart**
   - Persistent cart (database-backed)
   - Cart expiration policy
   - Quantity validation
   - Price calculation accuracy

3. **Checkout Process**
   - Multi-step checkout flow
   - Address validation
   - Shipping calculation
   - Tax calculation
   - Order confirmation emails

4. **User Management**
   - Guest checkout option
   - Account creation
   - Order history
   - Wishlist functionality
   - Email verification

5. **Admin Dashboard**
   - Order management
   - Inventory management
   - Analytics and reporting
   - Customer management
   - Product management

### Performance Optimization

- Use CDN for static assets
- Implement image optimization (WebP, lazy loading)
- Code splitting and lazy loading
- Server-side rendering for SEO
- Database query optimization
- Caching strategy (Redis)

### Monitoring and Analytics

- Error tracking (Sentry)
- Performance monitoring (Web Vitals)
- User analytics (Google Analytics, Mixpanel)
- Conversion tracking
- A/B testing infrastructure

---

## Changelog

### 2025-11-16
- Initial CLAUDE.md creation
- Established project structure guidelines
- Defined coding conventions
- Added security best practices
- Documented development workflow

---

## Notes for Future Updates

As the project evolves, update this document with:
- Actual tech stack once decided
- Real directory structure as it's created
- Specific coding patterns that emerge
- Team-specific conventions
- Lessons learned from issues encountered
- Performance benchmarks and goals
- Deployment specifics (hosting platform, etc.)

---

**Remember**: E-commerce applications handle sensitive user data and financial transactions. Security, reliability, and performance are paramount. When in doubt, prioritize security and ask for clarification.
