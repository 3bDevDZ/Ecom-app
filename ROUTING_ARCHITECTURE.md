# Routing Architecture - Clean Implementation

## Overview

The application uses **NestJS's built-in routing** with intelligent response handling. Controllers automatically serve both HTML (for browser views) and JSON (for API calls) based on the request's `Accept` header or `format` query parameter.

## How It Works

### 1. **Global API Prefix**

**File**: `src/main.ts` (lines 50-63)

```typescript
app.setGlobalPrefix('api', {
  exclude: [
    '/',
    '/health',
    '/login',
    '/logout',
    '/callback',
    '/products',      // Base route excluded
    '/categories',    // Base route excluded
    '/cart',          // Base route excluded
    '/orders',        // Base route excluded
  ],
});
```

**What this does**:
- Adds `/api` prefix to all routes by default
- Excludes specific base routes for HTML views
- Dynamic routes (e.g., `/products/:id`) are handled by the same controller

### 2. **Controller Route Handling**

Controllers check the request type and respond accordingly:

**Example**: `ProductController.getProductById()`

```typescript
@Get(':id')
async getProductById(@Param('id') id: string, @Query('format') format?: string, @Res() res?: Response) {
  const product = await this.queryBus.execute(new GetProductByIdQuery(id));

  // Check if HTML request
  const isHtmlRequest = format === 'html' ||
                       res?.req.headers.accept?.includes('text/html') ||
                       (res && !res.req.headers.accept?.includes('application/json'));

  if (isHtmlRequest && res) {
    return res.render('product-detail', viewModel); // HTML response
  }

  return product; // JSON response
}
```

### 3. **Route Access Patterns**

Routes work at **both** paths:

| Route | HTML View (Browser) | JSON API |
|-------|---------------------|----------|
| Product list | `/products` | `/api/products` |
| Product detail | `/products/:id` | `/api/products/:id` |
| Order list | `/orders` | `/api/orders` |
| Order detail | `/orders/:id` | `/api/orders/:id` |

## Why This Approach is Better

### ✅ **No Manual Mapping**
- No need to maintain route mappings in middleware
- Routes are defined once in controllers
- NestJS handles routing automatically

### ✅ **Automatic Response Format Detection**
- Controllers detect request type automatically
- Works with `Accept` header or `format` query param
- Single handler for both HTML and JSON

### ✅ **Scalable**
- Add new routes by creating controller methods
- No middleware updates needed
- Follows NestJS conventions

### ✅ **Clean Separation**
- HTML views: Direct routes (e.g., `/products/:id`)
- JSON API: Prefixed routes (e.g., `/api/products/:id`)
- Same controller, different paths

## Adding New Routes

### Example: Adding a new route

**1. Add to controller**:
```typescript
@Controller('reviews')
export class ReviewController {
  @Get(':id')
  async getReview(@Param('id') id: string, @Query('format') format?: string, @Res() res?: Response) {
    const review = await this.queryBus.execute(new GetReviewQuery(id));

    // Handle HTML
    if (format === 'html' && res) {
      return res.render('review-detail', { review });
    }

    // Handle JSON
    return review;
  }
}
```

**2. Exclude base route** (if needed for HTML views):
```typescript
// src/main.ts
app.setGlobalPrefix('api', {
  exclude: [
    // ... existing exclusions
    '/reviews',  // Add this
  ],
});
```

**That's it!** No middleware updates needed.

## How Dynamic Routes Work

When you exclude `/products` from the global prefix:
- `/products` → Works (excluded)
- `/products/:id` → Works (same controller, NestJS routing handles it)
- `/api/products` → Works (has prefix, goes to same controller)
- `/api/products/:id` → Works (has prefix, goes to same controller)

NestJS routing is smart enough to handle dynamic routes under excluded base paths.

## Migration from Old Approach

### Before (Manual Mapping)
```typescript
// route-proxy.middleware.ts
const routeMappings = {
  '/products/:id': { target: '/api/products/:id' },
  '/orders/:id': { target: '/api/orders/:id' },
  // ... manual mapping for each route
};
```

### After (Automatic)
```typescript
// Controllers handle it automatically
@Controller('products')
export class ProductController {
  @Get(':id')  // Works at both /products/:id and /api/products/:id
  async getProduct() { /* handles both HTML and JSON */ }
}
```

## Benefits

1. **Less Code**: No middleware mapping needed
2. **Type Safety**: Routes defined in TypeScript with decorators
3. **Maintainable**: Add routes in controllers, not middleware
4. **Standard**: Follows NestJS conventions
5. **Flexible**: Easy to add new routes

## Testing Routes

### Test HTML View:
```bash
curl http://localhost:3333/products/123
# or
curl -H "Accept: text/html" http://localhost:3333/products/123
```

### Test JSON API:
```bash
curl http://localhost:3333/api/products/123
# or
curl -H "Accept: application/json" http://localhost:3333/products/123?format=json
```

## Summary

- ✅ Removed manual route-proxy middleware
- ✅ Using NestJS's built-in routing
- ✅ Controllers handle both HTML and JSON automatically
- ✅ No manual mapping needed for new routes
- ✅ Clean, maintainable, scalable architecture

