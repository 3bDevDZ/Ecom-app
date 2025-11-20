# How to Access Product Catalog from Web Pages

## Overview

The Product Catalog module is accessible both as:
- **Web Pages (HTML)**: Server-rendered Handlebars views
- **API Endpoints (JSON)**: REST API for programmatic access

## Web Page Access (HTML Views)

### Product Listing Page (PLP)

**URL**: `http://localhost:3333/products`

**With Filters**:
- `http://localhost:3333/products?search=laptop`
- `http://localhost:3333/products?categoryId=<category-id>`
- `http://localhost:3333/products?brand=Apple`
- `http://localhost:3333/products?page=2&limit=20`
- `http://localhost:3333/products?sortBy=price-low`

**Query Parameters**:
- `search` - Search term
- `categoryId` - Filter by category
- `brand` - Filter by brand
- `tags` - Comma-separated tags
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `isActive` - Filter by active status (true/false)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sortBy` - Sort order: `best-match`, `price-low`, `price-high`, `name`

### Product Detail Page (PDP)

**URL**: `http://localhost:3333/products/:id`

**Example**: `http://localhost:3333/products/123e4567-e89b-12d3-a456-426614174000`

## API Access (JSON)

### Product Listing API

**URL**: `http://localhost:3333/api/products`

**Headers**: 
```
Accept: application/json
```

**Or use format parameter**:
- `http://localhost:3333/api/products?format=json`

### Product Detail API

**URL**: `http://localhost:3333/api/products/:id`

**Headers**: 
```
Accept: application/json
```

**Or use format parameter**:
- `http://localhost:3333/api/products/:id?format=json`

## How It Works

1. **Automatic Detection**: The controller automatically detects if the request is for HTML or JSON:
   - If `Accept: text/html` header is present → Returns HTML view
   - If `Accept: application/json` header is present → Returns JSON
   - If `format=html` query parameter → Returns HTML view
   - If `format=json` query parameter → Returns JSON
   - Default (browser request without Accept header) → Returns HTML view

2. **Route Configuration**:
   - `/products` routes are **excluded** from the `/api` prefix
   - `/api/products` routes are **under** the `/api` prefix
   - Both routes use the same controller but return different formats

## Examples

### Access Product Listing in Browser
```
http://localhost:3333/products
```

### Access Product Detail in Browser
```
http://localhost:3333/products/123e4567-e89b-12d3-a456-426614174000
```

### Access Product Listing via API (curl)
```bash
curl -H "Accept: application/json" http://localhost:3333/api/products
```

### Access Product Detail via API (curl)
```bash
curl -H "Accept: application/json" http://localhost:3333/api/products/123e4567-e89b-12d3-a456-426614174000
```

## Navigation Links

To link to products from other pages, use:

```handlebars
<!-- Product Listing -->
<a href="/products">View All Products</a>

<!-- Product Detail -->
<a href="/products/{{product.id}}">{{product.name}}</a>

<!-- Filtered Listing -->
<a href="/products?categoryId={{category.id}}">{{category.name}}</a>
```

## Testing

1. **Start the application**:
   ```bash
   cd Ecom-app
   pnpm run start:dev
   ```

2. **Open in browser**:
   - Product Listing: http://localhost:3333/products
   - Product Detail: http://localhost:3333/products/:id

3. **Test API**:
   ```bash
   curl http://localhost:3333/api/products
   ```

