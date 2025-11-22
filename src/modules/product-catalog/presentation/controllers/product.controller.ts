import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { UuidValidationPipe } from '../../../../common/pipes/uuid-validation.pipe';
import { PaginatedResponse } from '../../../../shared/application/pagination.dto';
import { JwtAuthGuard } from '../../../identity/application/guards/jwt-auth.guard';
import {
  CreateProductCommand,
  DeleteProductCommand,
  UpdateProductCommand,
} from '../../application/commands';
import {
  CreateProductDto,
  ProductDto,
  ProductImageDto,
  ProductVariantDto,
  UpdateProductDto,
} from '../../application/dtos';
import { GetCategoriesQuery, GetProductByIdQuery, SearchProductsQuery } from '../../application/queries';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { ProductPresenter } from '../presenters/product.presenter';
import { ProductSearchParamsDto } from './product-search-params.dto';

/**
 * ProductController
 *
 * REST API endpoints for product management.
 * Handles HTTP requests and delegates to CQRS command/query handlers.
 */
@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Search and list products' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully', type: [ProductDto] })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'brand', required: false, description: 'Filter by brand' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum price filter' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'format', required: false, description: 'Response format: json or html (default: json)' })
  async searchProducts(
    @Query() params: ProductSearchParamsDto,
    @Res() res?: Response,
  ): Promise<PaginatedResponse<ProductDto> | void> {
    const query = new SearchProductsQuery(
      params.search,
      params.categoryId,
      params.brand,
      params.tags ? params.tags.split(',').map(t => t.trim()) : undefined,
      params.minPrice ? Number.parseFloat(params.minPrice) : undefined,
      params.maxPrice ? Number.parseFloat(params.maxPrice) : undefined,
      params.isActive === undefined ? undefined : params.isActive === 'true',
      params.page ? Number.parseInt(params.page, 10) : 1,
      params.limit ? Number.parseInt(params.limit, 10) : 20,
    );

    const productsResponse = await this.queryBus.execute(query);

    // Return HTML view if format=html or Accept header prefers HTML, or if no res object (browser request)
    const isHtmlRequest =
      params.format === 'html' ||
      res?.req.headers.accept?.includes('text/html') ||
      (res && !res.req.headers.accept?.includes('application/json'));

    if (isHtmlRequest && res) {
      const categoriesResponse = await this.queryBus.execute(
        new GetCategoriesQuery(undefined, undefined, 1, 1000),
      );
      const categories = categoriesResponse.data;

      const activeFilters = [params.categoryId, params.brand, params.isActive].filter(
        (item): item is string => item !== undefined && item !== null && item !== '',
      );

      const viewModel = ProductPresenter.toListingViewModel(
        productsResponse,
        categories,
        params.search,
        params.categoryId,
        params.sortBy,
        activeFilters,
      );

      return res.render('products', viewModel);
    }

    // Return JSON for API
    return productsResponse;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully', type: ProductDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiQuery({ name: 'format', required: false, description: 'Response format: json or html (default: json)' })
  async getProductById(
    @Param('id', UuidValidationPipe) id: string,
    @Query('format') format?: string,
    @Res() res?: Response,
  ): Promise<ProductDto | void> {
    const query = new GetProductByIdQuery(id);
    const product = await this.queryBus.execute(query);

    // Return HTML view if format=html or Accept header prefers HTML, or if no res object (browser request)
    const isHtmlRequest =
      format === 'html' ||
      res?.req.headers.accept?.includes('text/html') ||
      (res && !res.req.headers.accept?.includes('application/json'));

    if (isHtmlRequest && res) {
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

    // Return JSON for API
    return product;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully', type: ProductDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Product with SKU already exists' })
  @HttpCode(HttpStatus.CREATED)
  async createProduct(@Body() createDto: CreateProductDto): Promise<ProductDto> {
    const command = new CreateProductCommand(
      createDto.id,
      createDto.sku,
      createDto.name,
      createDto.description,
      createDto.categoryId,
      createDto.brand,
      createDto.images,
      createDto.basePrice,
      createDto.currency,
      createDto.minOrderQuantity,
      createDto.maxOrderQuantity,
      createDto.tags,
    );

    const product = await this.commandBus.execute(command);
    return this.toDto(product);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update an existing product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully', type: ProductDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(
    @Param('id', UuidValidationPipe) id: string,
    @Body() updateDto: UpdateProductDto,
  ): Promise<ProductDto> {
    const command = new UpdateProductCommand(
      id,
      updateDto.name,
      updateDto.description,
      updateDto.categoryId,
      updateDto.brand,
      updateDto.images,
      updateDto.basePrice,
      updateDto.currency,
      updateDto.minOrderQuantity,
      updateDto.maxOrderQuantity,
      updateDto.tags,
      updateDto.isActive,
    );

    const product = await this.commandBus.execute(command);
    return this.toDto(product);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 204, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProduct(@Param('id', UuidValidationPipe) id: string): Promise<void> {
    const command = new DeleteProductCommand(id);
    await this.commandBus.execute(command);
  }

  /**
   * Transform Product domain entity to ProductDto
   */
  private toDto(product: any): ProductDto {
    return new ProductDto(
      product.id,
      product.sku.value,
      product.name,
      product.description,
      product.categoryId,
      product.brand,
      product.images.map(
        (img: any) =>
          new ProductImageDto(img.url, img.altText, img.displayOrder, img.isPrimary),
      ),
      product.variants.map(
        (v: any) =>
          new ProductVariantDto(
            v.id,
            v.sku.value,
            Object.fromEntries(v.attributes),
            v.priceDelta?.amount ?? null,
            v.priceDelta?.currency ?? product.basePrice.currency,
            v.inventory.availableQuantity,
            v.inventory.reservedQuantity,
            v.isActive,
          ),
      ),
      product.basePrice.amount,
      product.basePrice.currency,
      product.minOrderQuantity,
      product.maxOrderQuantity,
      product.isActive,
      product.tags,
      product.createdAt,
      product.updatedAt,
    );
  }
}


