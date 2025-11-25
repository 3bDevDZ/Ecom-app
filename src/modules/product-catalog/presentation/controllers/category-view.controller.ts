import { Controller, Get, Param, Res } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Response } from 'express';
import { UuidValidationPipe } from '../../../../common/pipes/uuid-validation.pipe';
import { GetCategoriesQuery, SearchProductsQuery } from '../../application/queries';
import { ProductPresenter } from '../presenters/product.presenter';

/**
 * CategoryViewController
 *
 * Handles HTML view rendering for category pages.
 * Separate from CategoryController (API) for proper separation of concerns.
 *
 * Routes:
 * - GET /categories - Category listing page
 * - GET /categories/:id - Category detail page (products in category)
 */
@Controller('categories')
export class CategoryViewController {
  constructor(
    private readonly queryBus: QueryBus,
  ) { }

  /**
   * Category listing page
   * GET /categories
   */
  @Get()
  async listCategories(@Res() res: Response): Promise<void> {
    const query = new GetCategoriesQuery(undefined, undefined, 1, 1000);
    const categoriesResponse = await this.queryBus.execute(query);

    const viewModel = {
      categories: categoriesResponse.data,
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Categories' },
      ],
    };

    return res.render('categories', viewModel);
  }

  /**
   * Category detail page (products in category)
   * GET /categories/:id
   */
  @Get(':id')
  async getCategoryDetail(
    @Param('id', UuidValidationPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    // Get category
    const categoriesResponse = await this.queryBus.execute(
      new GetCategoriesQuery(undefined, undefined, 1, 1000),
    );
    const category = categoriesResponse.data.find(c => c.id === id);

    if (!category) {
      return res.status(404).render('error', {
        message: 'Category not found',
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Categories', href: '/categories' },
        ],
      });
    }

    // Get products in this category
    const productsQuery = new SearchProductsQuery(
      undefined,
      [id],
      undefined,
      undefined,
      undefined,
      undefined,
      true,
      1,
      20,
    );
    const productsResponse = await this.queryBus.execute(productsQuery);

    const viewModel = ProductPresenter.toListingViewModel(
      productsResponse,
      categoriesResponse.data,
      undefined,
      id,
      undefined,
      [],
    );

    // Update breadcrumbs to include category
    viewModel.breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Categories', href: '/categories' },
      { label: category.name },
    ];

    return res.render('products', viewModel);
  }
}

