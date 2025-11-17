import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    name: string;
  };

  @ApiProperty()
  message: string;
}
