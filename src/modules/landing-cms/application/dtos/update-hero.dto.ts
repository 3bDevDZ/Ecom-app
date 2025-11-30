import { IsString, IsNotEmpty, IsUrl, MaxLength } from 'class-validator';

export class UpdateHeroDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  heading: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  subheading: string;

  @IsUrl()
  @IsNotEmpty()
  backgroundImageUrl: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  ctaButtonText: string;

  @IsString()
  @IsNotEmpty()
  ctaButtonLink: string;
}
