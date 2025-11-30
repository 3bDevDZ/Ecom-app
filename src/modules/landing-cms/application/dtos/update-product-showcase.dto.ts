import { IsArray, ValidateNested, IsString, IsNotEmpty, IsUrl, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ShowcaseCategoryDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;

  @IsInt()
  @Min(0)
  displayOrder: number;
}

export class UpdateProductShowcaseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShowcaseCategoryDto)
  categories: ShowcaseCategoryDto[];
}
