import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { UuidValidationPipe } from '../../../../common/pipes/uuid-validation.pipe';
import { PaginatedResponse } from '../../../../shared/application/pagination.dto';
import { JwtAuthGuard } from '../../../identity/application/guards/jwt-auth.guard';
import {
  CreateCategoryCommand,
  DeleteCategoryCommand,
  UpdateCategoryCommand,
} from '../../application/commands';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from '../../application/dtos';
import { GetCategoriesQuery } from '../../application/queries';
import { SearchProductsQuery } from '../../application/queries/search-products.query';

/**
 * CategoryController
 *
 * REST API endpoints for category management.
 * Handles HTTP requests and delegates to CQRS command/query handlers.
 */
@ApiTags('Categories')
@Controller('api/categories')
export class CategoryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully', type: [CategoryDto] })
  @ApiQuery({ name: 'parentId', required: false, description: 'Filter by parent category ID' })
  @ApiQuery({ name: 'rootOnly', required: false, description: 'Get only root categories' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'format', required: false, description: 'Response format: json or html' })
  async getCategories(
    @Query('parentId') parentId?: string,
    @Query('rootOnly') rootOnly?: string,
    @Query('isActive') isActive?: string,
    @Query('format') format?: string,
    @Res() res?: Response,
  ): Promise<CategoryDto[] | void> {
    const query = new GetCategoriesQuery(
      rootOnly === 'true' ? null : parentId,
      isActive !== undefined ? isActive === 'true' : undefined,
      1,
      1000, // Large limit to get all categories
    );

    const result: PaginatedResponse<CategoryDto> = await this.queryBus.execute(query);

    // Return HTML view if format=html or Accept header prefers HTML
    const isHtmlRequest =
      format === 'html' ||
      res?.req.headers.accept?.includes('text/html') ||
      (res && !res.req.headers.accept?.includes('application/json'));

    if (isHtmlRequest && res) {
      const viewModel = {
        categories: result.data,
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Categories' },
        ],
      };
      return res.render('categories', viewModel);
    }

    return result.data;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully', type: CategoryDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiQuery({ name: 'format', required: false, description: 'Response format: json or html' })
  async getCategoryById(
    @Param('id', UuidValidationPipe) id: string,
    @Query('format') format?: string,
    @Res() res?: Response,
  ): Promise<CategoryDto | void> {
    // Get category by ID
    const categoriesQuery = new GetCategoriesQuery(undefined, undefined, 1, 1000);
    const categoriesResult: PaginatedResponse<CategoryDto> = await this.queryBus.execute(categoriesQuery);
    const category = categoriesResult.data.find(c => c.id === id);

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Return HTML view if format=html or Accept header prefers HTML
    const isHtmlRequest =
      format === 'html' ||
      res?.req.headers.accept?.includes('text/html') ||
      (res && !res.req.headers.accept?.includes('application/json'));

    if (isHtmlRequest && res) {
      // Get products for this category (default pagination)
      const productsQuery = new SearchProductsQuery(
        undefined, // search term
        id, // categoryId
        undefined, // brand
        undefined, // tags
        undefined, // minPrice
        undefined, // maxPrice
        true, // isActive
        1, // page
        20, // limit
      );

      const productsResult = await this.queryBus.execute(productsQuery);

      // Build breadcrumbs
      const breadcrumbs = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'Categories', href: '/categories' },
        { label: category.name },
      ];

      // Calculate pagination info
      const totalPages = Math.ceil(productsResult.total / productsResult.limit);

      const viewModel = {
        category,
        products: productsResult.data,
        pagination: {
          page: productsResult.page,
          limit: productsResult.limit,
          total: productsResult.total,
          totalPages,
          hasNext: productsResult.page < totalPages,
          hasPrev: productsResult.page > 1,
        },
        breadcrumbs,
      };

      return res.render('category-detail', viewModel);
    }

    // Return JSON for API
    return category;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully', type: CategoryDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Category with slug already exists' })
  @HttpCode(HttpStatus.CREATED)
  async createCategory(@Body() createDto: CreateCategoryDto): Promise<CategoryDto> {
    const command = new CreateCategoryCommand(
      createDto.id,
      createDto.name,
      createDto.slug,
      createDto.description,
      createDto.parentId,
      createDto.displayOrder,
    );

    const category = await this.commandBus.execute(command);
    return this.toDto(category);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update an existing category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully', type: CategoryDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async updateCategory(
    @Param('id', UuidValidationPipe) id: string,
    @Body() updateDto: UpdateCategoryDto,
  ): Promise<CategoryDto> {
    const command = new UpdateCategoryCommand(
      id,
      updateDto.name,
      updateDto.description,
      updateDto.displayOrder,
      updateDto.isActive,
    );

    const category = await this.commandBus.execute(command);
    return this.toDto(category);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Category has products or subcategories' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategory(@Param('id', UuidValidationPipe) id: string): Promise<void> {
    const command = new DeleteCategoryCommand(id);
    await this.commandBus.execute(command);
  }

  /**
   * Transform Category domain entity to CategoryDto
   */
  private toDto(category: any): CategoryDto {
    return new CategoryDto(
      category.id,
      category.name,
      category.slug,
      category.description,
      category.parentId,
      category.displayOrder,
      category.isActive,
      category.createdAt,
      category.updatedAt,
    );
  }
}

