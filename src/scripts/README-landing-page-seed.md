# Landing Page Seed Script

## Overview

This script seeds the database with default landing page content for the B2B E-Commerce Platform. It populates the `landing_page_content` table with realistic sample data that can be immediately used for testing and development.

## Usage

### Run the seed script

```bash
# Using pnpm
pnpm seed:landing-page

# Using npm
npm run seed:landing-page

# Direct execution
ts-node -r tsconfig-paths/register src/scripts/seed-landing-page.ts
```

### Prerequisites

- Database must be running (PostgreSQL)
- Migrations must be applied (`pnpm migration:run`)
- Environment variables must be configured in `.env`

## What Gets Seeded

The script creates a single record in the `landing_page_content` table with the following sections:

### 1. Hero Section
- **Heading**: "Premium Industrial Solutions for Your Business"
- **Subheading**: Descriptive text about the platform
- **Background Image**: High-quality industrial image from Unsplash
- **CTA Button**: "Browse Products" linking to `/products`

### 2. Trust Logos (4 companies)
- TechCorp Industries
- Global Manufacturing
- AutoSystems Ltd
- Industrial Solutions Inc

Each logo includes:
- Unique ID
- Company name
- Placeholder image URL
- Display order

### 3. Product Showcase (4 categories)
- Industrial Components
- Electronics
- Actuators
- Power Supplies

Each category includes:
- Unique ID
- Category name
- Featured image from Unsplash
- Display order

### 4. Showroom Information
- Complete business address
- Business hours (Mon-Fri, Saturday)
- Map location placeholder

### 5. Contact Section
- Heading and description for contact form
- Encouraging text for customer inquiries

### 6. Footer Content
- Company description (about the business)
- Navigation links (6 links):
  - Products
  - Categories
  - About Us
  - Contact
  - Terms of Service
  - Privacy Policy
- Copyright text

### 7. Publication Status
- Set to `isPublished: true` so content is immediately visible
- Timestamps automatically generated

## Behavior

### First Run
- Creates new landing page content
- Sets publication status to `true`
- Returns success message with content ID

### Subsequent Runs
- Detects existing content
- Skips seeding to prevent duplicates
- Displays warning message

### To Re-seed
If you need to re-run the seed:

1. **Delete existing content** (using psql or admin interface):
   ```sql
   DELETE FROM landing_page_content;
   ```

2. **Or modify the script** to update instead of skip:
   - Comment out the existence check
   - Change `save()` to handle updates

## Database Schema

The script populates these fields in `landing_page_content`:

```typescript
{
  id: UUID (auto-generated)
  heroHeading: string
  heroSubheading: string
  heroBackgroundImageUrl: string
  heroCtaButtonText: string
  heroCtaButtonLink: string
  trustLogos: JSON array
  productShowcase: JSON array
  showroomAddress: string
  showroomBusinessHours: string
  showroomMapImageUrl: string
  contactHeading: string
  contactDescription: string
  footerCompanyDescription: string
  footerNavigationLinks: JSON array
  footerCopyrightText: string
  isPublished: boolean
  createdAt: timestamp (auto)
  updatedAt: timestamp (auto)
}
```

## Viewing the Results

After seeding, you can:

1. **View the landing page**:
   - Navigate to: http://localhost:3333/
   - Content should be immediately visible

2. **Use the CMS admin panel**:
   - Access admin routes at `/api/cms/landing/*`
   - Requires JWT authentication

3. **Query the database**:
   ```sql
   SELECT * FROM landing_page_content;
   ```

## Customization

To customize the seeded content:

1. Open `src/scripts/seed-landing-page.ts`
2. Modify the `landingPageContent` object
3. Update text, URLs, or structure as needed
4. Re-run the seed (after deleting existing content)

### Example Customizations

**Change hero heading:**
```typescript
heroHeading: 'Your Custom Heading Here',
```

**Add more trust logos:**
```typescript
trustLogos: [
  {
    id: uuidv4(),
    name: 'New Company',
    imageUrl: 'https://example.com/logo.png',
    displayOrder: 5,
  },
  // ... more logos
],
```

**Update footer links:**
```typescript
footerNavigationLinks: [
  { label: 'Custom Link', url: '/custom' },
  // ... more links
],
```

## Integration with Main Seed Script

This is a separate seed script focused only on landing page content. Other seed scripts include:

- `seed-database.ts` - Products and categories
- `seed-orders.ts` - Sample orders
- `seed-keycloak-users.ts` - Authentication users

You can run all seeds sequentially:
```bash
pnpm seed              # Products & categories
pnpm seed:landing-page # Landing page
pnpm seed:orders       # Orders
pnpm seed:keycloak     # Users
```

## Troubleshooting

### Error: "Cannot find module"
- Ensure TypeScript dependencies are installed: `pnpm install`
- Check that tsconfig paths are configured correctly

### Error: "Table does not exist"
- Run migrations first: `pnpm migration:run`
- Verify migration `CreateLandingPageContentTable` exists

### Error: "Connection refused"
- Ensure PostgreSQL is running: `pnpm docker:up`
- Check `.env` database configuration

### Content not visible on landing page
- Verify `isPublished` is set to `true`
- Check application is running: `pnpm start:dev`
- Clear browser cache and reload

## Related Files

- **Entity**: `src/modules/landing-cms/infrastructure/persistence/entities/landing-page-content.entity.ts`
- **Migration**: `src/migrations/*-CreateLandingPageContentTable.ts`
- **Controller**: `src/modules/landing-cms/presentation/controllers/landing-cms.controller.ts`
- **View Template**: `src/views/pages/landing.hbs`

## License

Part of the B2B E-Commerce Platform project.
