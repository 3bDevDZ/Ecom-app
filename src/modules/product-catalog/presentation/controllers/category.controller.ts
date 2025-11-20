import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  CreateCategoryCommand,
  UpdateCategoryCommand,
  DeleteCategoryCommand,
} from '../../application/commands';
import { GetCategoriesQuery } from '../../application/queries';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from '../../application/dtos';
import { PaginatedResponse } from '../../../../shared/application/pagination.dto';
import { UuidValidationPipe } from '../../../../common/pipes/uuid-validation.pipe';
import { JwtAuthGuard } from '../../../identity/application/guards/jwt-auth.guard';

/**
 * CategoryController
 *
 * REST API endpoints for category management.
 * Handles HTTP requests and delegates to CQRS command/query handlers.
 */
@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully', type: [CategoryDto] })
  @ApiQuery({ name: 'parentId', required: false, description: 'Filter by parent category ID' })
  @ApiQuery({ name: 'rootOnly', required: false, description: 'Get only root categories' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  async getCategories(
    @Query('parentId') parentId?: string,
    @Query('rootOnly') rootOnly?: string,
    @Query('isActive') isActive?: string,
  ): Promise<CategoryDto[]> {
    const query = new GetCategoriesQuery(
      rootOnly === 'true' ? null : parentId,
      isActive !== undefined ? isActive === 'true' : undefined,
      1,
      1000, // Large limit to get all categories
    );

    const result: PaginatedResponse<CategoryDto> = await this.queryBus.execute(query);
    return result.data;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully', type: CategoryDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryById(@Param('id', UuidValidationPipe) id: string): Promise<CategoryDto> {
    // We need to get the category by ID - for now, get all and filter
    // In production, create a GetCategoryByIdQuery
    const query = new GetCategoriesQuery(undefined, undefined, 1, 1000);
    const result: PaginatedResponse<CategoryDto> = await this.queryBus.execute(query);
    const category = result.data.find(c => c.id === id);
    
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    
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

