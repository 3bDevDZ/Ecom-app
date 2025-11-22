import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

/**
 * Product Search Parameters DTO
 * Used to group query parameters for product search endpoint
 */
export class ProductSearchParamsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    return value ? [value] : undefined;
  })
  @IsString({ each: true })
  categoryId?: string | string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    return value ? [value] : undefined;
  })
  @IsString({ each: true })
  brand?: string | string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  minPrice?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  maxPrice?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  isActive?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  viewMode?: string;
}

