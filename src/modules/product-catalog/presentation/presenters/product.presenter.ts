import { PaginatedResponse } from '../../../../shared/application/pagination.dto';
import { CategoryDto, ProductDto } from '../../application/dtos';

/**
 * Product Listing Page View Model
 */
export interface ProductListingViewModel {
  products: ProductDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    start: number;
    end: number;
    hasNext: boolean;
    hasPrevious: boolean;
    pages: number[];
  };
  breadcrumbs: Array<{ label: string; href?: string }>;
  filters: Array<{
    name: string;
    label: string;
    options: Array<{ value: string; label: string }>;
  }>;
  activeFilters: string[];
  searchTerm?: string;
  sortBy?: string;
  viewMode?: string;
  category?: CategoryDto;
}

/**
 * Product Detail Page View Model
 */
export interface ProductDetailViewModel {
  product: ProductDto;
  relatedProducts?: ProductDto[];
  breadcrumbs: Array<{ label: string; href?: string }>;
}

/**
 * Product Presenter
 *
 * Transforms domain DTOs into view models for Handlebars templates.
 */
export class ProductPresenter {
  /**
   * Build view model for product listing page
   */
  static toListingViewModel(
    productsResponse: PaginatedResponse<ProductDto>,
    categories: CategoryDto[],
    searchTerm?: string,
    categoryId?: string,
    sortBy?: string,
    activeFilters: string[] = [],
    viewMode?: string,
  ): ProductListingViewModel {
    const category = categoryId
      ? categories.find(c => c.id === categoryId)
      : undefined;

    // Build breadcrumbs
    const breadcrumbs: Array<{ label: string; href?: string }> = [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
    ];

    if (category) {
      breadcrumbs.push({ label: category.name });
    }

    // Build filters from categories and brands
    const brands = new Set<string>();
    for (const product of productsResponse.data) {
      if (product.brand) {
        brands.add(product.brand);
      }
    }

    const filters = [
      {
        name: 'categoryId',
        label: 'Category',
        options: categories.map(cat => ({
          value: cat.id,
          label: cat.name,
        })),
      },
      {
        name: 'brand',
        label: 'Brand',
        options: Array.from(brands).map(brand => ({
          value: brand,
          label: brand,
        })),
      },
      {
        name: 'isActive',
        label: 'Availability',
        options: [
          { value: 'true', label: 'In Stock' },
          { value: 'false', label: 'Out of Stock' },
        ],
      },
    ];

    // Calculate pagination
    const totalPages = Math.ceil(productsResponse.total / productsResponse.limit);
    const pages: number[] = [];
    const currentPage = productsResponse.page;

    // Show max 5 page numbers around current page
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(5, totalPages);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - 4);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Ensure products have totalAvailableQuantity calculated
    const productsWithQuantity = productsResponse.data.map(product => {
      if (product.totalAvailableQuantity === undefined) {
        // Recalculate if missing
        const totalQty = product.variants.reduce(
          (sum, v) => sum + v.availableQuantity,
          0,
        );
        return new ProductDto(
          product.id,
          product.sku,
          product.name,
          product.description,
          product.categoryId,
          product.brand,
          product.images,
          product.variants,
          product.basePrice,
          product.currency,
          product.minOrderQuantity,
          product.maxOrderQuantity,
          product.isActive,
          product.tags,
          product.createdAt,
          product.updatedAt,
          totalQty,
          product.specifications,
          product.documents,
          product.reviews,
        );
      }
      return product;
    });

    return {
      products: productsWithQuantity,
      pagination: {
        page: productsResponse.page,
        limit: productsResponse.limit,
        total: productsResponse.total,
        start: (productsResponse.page - 1) * productsResponse.limit + 1,
        end: Math.min(
          productsResponse.page * productsResponse.limit,
          productsResponse.total,
        ),
        hasNext: productsResponse.hasNextPage,
        hasPrevious: productsResponse.hasPreviousPage,
        pages,
      },
      breadcrumbs,
      filters,
      activeFilters,
      searchTerm,
      sortBy: sortBy || 'best-match',
      viewMode: viewMode || 'grid',
      category,
    };
  }

  /**
   * Build view model for product detail page
   */
  static toDetailViewModel(
    product: ProductDto,
    relatedProducts?: ProductDto[],
    category?: CategoryDto,
  ): ProductDetailViewModel {
    // Build breadcrumbs
    const breadcrumbs: Array<{ label: string; href?: string }> = [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Categories', href: '/categories' },
    ];

    if (category) {
      breadcrumbs.push({ label: category.name, href: `/categories/${category.id}` });
    }

    breadcrumbs.push({ label: product.name });

    // Enhance variants with calculated final prices for easier template rendering
    const enhancedVariants = product.variants.map(variant => ({
      ...variant,
      price: variant.calculateFinalPrice(product.basePrice),
    }));

    // Create an enhanced product object that preserves getters and metadata
    const enhancedProduct = {
      ...product,
      variants: enhancedVariants,
      hasVariants: product.hasVariants, // Explicitly copy the getter result
      priceRange: product.priceRange,   // Explicitly copy the getter result
      primaryImage: product.primaryImage, // Explicitly copy the getter result
      specifications: product.specifications, // Preserve specifications
      documents: product.documents, // Preserve documents
      reviews: product.reviews, // Preserve reviews
    };

    return {
      product: enhancedProduct as any,
      relatedProducts: relatedProducts || [],
      breadcrumbs,
    };
  }
}

