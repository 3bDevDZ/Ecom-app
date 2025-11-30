import { IsArray, ValidateNested, IsString, IsNotEmpty, IsUrl, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TrustLogoDto {
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

export class UpdateTrustLogosDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrustLogoDto)
  logos: TrustLogoDto[];
}
