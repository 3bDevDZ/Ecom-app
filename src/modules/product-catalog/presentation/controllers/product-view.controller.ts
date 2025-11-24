import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Response } from 'express';
import { UuidValidationPipe } from '../../../../common/pipes/uuid-validation.pipe';
import { GetCategoriesQuery, GetProductByIdQuery, SearchProductsQuery } from '../../application/queries';
import { ProductPresenter } from '../presenters/product.presenter';
import { ProductSearchParamsDto } from './product-search-params.dto';

/**
 * ProductViewController
 *
 * Handles HTML view rendering for product pages.
 * Separate from ProductController (API) for proper separation of concerns.
 *
 * Routes:
 * - GET /products - Product listing page
 * - GET /products/:id - Product detail page
 */
@Controller('products')
export class ProductViewController {
  constructor(
    private readonly queryBus: QueryBus,
  ) { }

  /**
   * Product listing page
   * GET /products
   */
  @Get()
  async listProducts(
    @Query() params: ProductSearchParamsDto,
    @Res() res: Response,
  ): Promise<void> {
    // Handle multiple values for categoryId and brand (AND filtering)
    const categoryIds = params.categoryId
      ? (Array.isArray(params.categoryId) ? params.categoryId : [params.categoryId])
      : undefined;
    const brands = params.brand
      ? (Array.isArray(params.brand) ? params.brand : [params.brand])
      : undefined;

    const query = new SearchProductsQuery(
      params.search,
      categoryIds,
      brands,
      params.tags ? params.tags.split(',').map(t => t.trim()) : undefined,
      params.minPrice ? Number.parseFloat(params.minPrice) : undefined,
      params.maxPrice ? Number.parseFloat(params.maxPrice) : undefined,
      params.isActive === undefined ? undefined : params.isActive === 'true',
      params.page ? Number.parseInt(params.page, 10) : 1,
      params.limit ? Number.parseInt(params.limit, 10) : 20,
      params.sortBy as 'best-match' | 'price-low' | 'price-high' | 'name' | 'name-desc' | undefined,
    );

    const productsResponse = await this.queryBus.execute(query);

    // Get categories for filters
    const categoriesResponse = await this.queryBus.execute(
      new GetCategoriesQuery(undefined, undefined, 1, 1000),
    );
    const categories = categoriesResponse.data;

    // Build activeFilters array from URL params
    const activeFilters: string[] = [];
    if (categoryIds) activeFilters.push(...categoryIds);
    if (brands) activeFilters.push(...brands);
    if (params.isActive) activeFilters.push(params.isActive);

    const viewModel = ProductPresenter.toListingViewModel(
      productsResponse,
      categories,
      params.search,
      categoryIds && categoryIds.length > 0 ? categoryIds[0] : undefined,
      params.sortBy,
      activeFilters,
      params.viewMode,
    );

    return res.render('products', viewModel);
  }

  /**
   * Product detail page
   * GET /products/:id
   */
  @Get(':id')
  async getProductDetail(
    @Param('id', UuidValidationPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const query = new GetProductByIdQuery(id);
    const product = await this.queryBus.execute(query);

    // Get category for breadcrumbs
    const categoriesResponse = await this.queryBus.execute(
      new GetCategoriesQuery(undefined, undefined, 1, 1000),
    );
    const category = categoriesResponse.data.find(c => c.id === product.categoryId);

    // Get related products (same category, limit 4)
    const relatedQuery = new SearchProductsQuery(
      undefined,
      product.categoryId,
      undefined,
      undefined,
      undefined,
      undefined,
      true,
      1,
      4,
    );
    const relatedResponse = await this.queryBus.execute(relatedQuery);
    const relatedProducts = relatedResponse.data.filter(p => p.id !== product.id).slice(0, 4);

    const viewModel = ProductPresenter.toDetailViewModel(product, relatedProducts, category);

    return res.render('product-detail', viewModel);
  }
}

