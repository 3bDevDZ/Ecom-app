import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateContactSectionDto {
  @IsString()
  @IsNotEmpty()
  heading: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
