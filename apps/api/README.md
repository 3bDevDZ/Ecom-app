# E-Commerce API - Templating Guide

## Overview

This NestJS application uses Handlebars (HBS) as the templating engine with Tailwind CSS and SCSS for styling.

## Project Structure

```
apps/api/
├── src/
│   ├── styles/
│   │   └── main.scss          # Main SCSS file with Tailwind directives
│   └── infrastructure/
│       └── helpers/
│           └── handlebars-helpers.ts  # Custom Handlebars helpers
├── views/
│   ├── layouts/
│   │   ├── base.hbs          # Base layout (no header/footer)
│   │   └── main.hbs          # Main layout (with header/footer)
│   ├── partials/
│   │   ├── header.hbs        # Site header
│   │   └── footer.hbs        # Site footer
│   └── *.hbs                 # Page templates
└── public/
    └── css/
        └── styles.css         # Compiled Tailwind + SCSS
```

## Layouts

### Base Layout (`base.hbs`)
Use for pages that need complete custom layout (e.g., login, error pages):
```handlebars
{{!-- No header/footer, just body content --}}
```

### Main Layout (`main.hbs`)
Use for standard pages with header and footer:
```handlebars
{{!-- Includes header, main content area, and footer --}}
```

## Using Layouts in NestJS Controllers

```typescript
@Get('/products')
@Render('products-list')  // Uses main.hbs layout by default
getProducts() {
  return {
    pageTitle: 'Products',
    metaDescription: 'Browse our products',
    products: [...],
  };
}

@Get('/login')
@Render('login')  // Uses base.hbs layout
getLogin() {
  return {
    pageTitle: 'Login',
    showDemo: true,
  };
}
```

## Available Handlebars Helpers

### `formatMoney`
Format currency values:
```handlebars
{{formatMoney price 'USD'}}  {{!-- Output: $99.99 --}}
```

### `formatDate`
Format date strings:
```handlebars
{{formatDate createdAt}}  {{!-- Output: January 15, 2024, 10:30 AM --}}
```

### `currentYear`
Get current year for copyright:
```handlebars
© {{currentYear}} Company Name  {{!-- Output: © 2025 Company Name --}}
```

### `eq`
Equality comparison:
```handlebars
{{#if (eq status 'active')}}Active{{/if}}
```

### `or`
Logical OR:
```handlebars
{{#if (or isAdmin isModerator)}}Show admin panel{{/if}}
```

## Styling System

### Tailwind CSS Configuration

The project uses Tailwind CSS v4 with custom theme colors defined in `tailwind.config.js`:

- **Primary**: `#0A2540` (Deep blue)
- **Secondary**: `#00C49A` (Vibrant teal)
- **Background Light**: `#F8F9FA`
- **Background Dark**: `#101922`

### Custom CSS Classes

#### Buttons
```html
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary">Secondary Button</button>
<button class="btn btn-outline">Outline Button</button>
<button class="btn btn-primary btn-lg">Large Button</button>
<button class="btn btn-primary btn-sm">Small Button</button>
```

#### Cards
```html
<div class="card">
  <div class="card-header">Header</div>
  <div class="card-body">Content</div>
  <div class="card-footer">Footer</div>
</div>
```

#### Forms
```html
<div class="form-group">
  <label class="form-label" for="email">Email</label>
  <input class="form-input" type="email" id="email" />
</div>
```

#### Product Cards
```html
<a href="/product/123" class="product-card">
  <div class="product-image-wrapper">
    <img src="image.jpg" class="product-image" alt="Product" />
    <span class="product-badge badge-success">New</span>
  </div>
  <h3>Product Name</h3>
</a>
```

#### Navigation
```html
<a href="/products" class="nav-link">Products</a>
```

#### Page Layout
```html
<div class="page-container">
  <div class="page-header">
    <h1 class="page-title">Page Title</h1>
    <p class="page-subtitle">Subtitle text</p>
  </div>
  <!-- Page content -->
</div>
```

## Development Workflow

### Building Styles

```bash
# Development build with watch mode
npm run dev:css

# Production build (compressed)
npm run build:css

# Or use the combined dev command
npm run dev
```

### Adding New Pages

1. **Create template file** in `apps/api/views/`:
```handlebars
{{!-- my-page.hbs --}}
<div class="page-container">
  <div class="page-header">
    <h1 class="page-title">{{pageTitle}}</h1>
  </div>
  
  {{!-- Your content here --}}
</div>
```

2. **Create controller route**:
```typescript
@Get('/my-page')
@Render('my-page')
getMyPage() {
  return {
    pageTitle: 'My Page',
    data: [...],
  };
}
```

3. **Use layout** (optional):
- If using main layout: template will automatically have header/footer
- If using base layout: you control the entire page structure

### Customizing Styles

1. Edit `apps/api/src/styles/main.scss`
2. Add custom components in `@layer components { ... }`
3. Add utilities in `@layer utilities { ... }`
4. Build CSS: `npm run build:css`

## Dark Mode Support

The application supports dark mode through the `dark:` Tailwind prefix:

```html
<div class="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
  Content that adapts to dark mode
</div>
```

Toggle dark mode by adding/removing the `dark` class on the `<html>` element.

## Icons

Material Symbols icons are available through the class `material-symbols-outlined`:

```html
<span class="material-symbols-outlined">shopping_cart</span>
<span class="material-symbols-outlined">search</span>
<span class="material-symbols-outlined">person</span>
```

## Template Variables

Common variables you can pass to templates:

```typescript
{
  pageTitle: string;           // Page title for <title> tag
  metaDescription: string;     // Meta description
  additionalStyles: string;    // Additional <style> or <link> tags
  additionalScripts: string;   // Additional <script> tags
  user: User;                  // Current user object
  cartCount: number;           // Shopping cart item count
  error: string;               // Error message to display
  success: string;             // Success message to display
}
```

## Best Practices

1. **Always use semantic HTML** - Use proper heading hierarchy, semantic elements
2. **Responsive design** - Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`)
3. **Accessibility** - Add proper ARIA labels, alt text for images
4. **Performance** - Lazy load images, minimize custom CSS
5. **Consistency** - Use defined component classes instead of inline Tailwind
6. **Dark mode** - Always provide dark mode variants for custom styles

## Troubleshooting

### Styles not applying
1. Make sure CSS is built: `npm run build:css`
2. Check that `styles.css` exists in `apps/api/public/css/`
3. Verify Tailwind classes are included in `tailwind.config.js` content paths

### Layout not rendering
1. Ensure `setViewEngine('hbs')` is set in `main.ts`
2. Check that partials are registered
3. Verify layout file exists in `views/layouts/`

### Handlebars helper not working
1. Check helper is exported in `handlebars-helpers.ts`
2. Verify helper is registered in `main.ts`
3. Use correct syntax: `{{helperName}}` or `{{#if (helperName)}}...{{/if}}`
