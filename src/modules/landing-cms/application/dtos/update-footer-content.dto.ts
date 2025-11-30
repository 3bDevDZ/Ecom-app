import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class NavigationLinkDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  url: string;
}

export class UpdateFooterContentDto {
  @IsString()
  @IsNotEmpty()
  companyDescription: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NavigationLinkDto)
  navigationLinks: NavigationLinkDto[];

  @IsString()
  @IsNotEmpty()
  copyrightText: string;
}
