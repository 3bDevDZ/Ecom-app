import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class UpdateShowroomInfoDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  businessHours: string;

  @IsUrl()
  @IsNotEmpty()
  mapImageUrl: string;
}
