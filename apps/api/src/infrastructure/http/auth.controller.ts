import { Controller, Post, Body, Res, Get, Session, Redirect } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { LoginDto } from '../../application/auth/dtos/login.dto';
import { LoginUseCase } from '../../application/auth/use-cases/login.use-case';

/**
 * Auth Controller
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  async login(
    @Body() loginDto: LoginDto,
    @Session() session: Record<string, any>,
    @Res() res: Response,
  ) {
    try {
      const result = await this.loginUseCase.execute(
        loginDto.email,
        loginDto.password,
      );

      session.user = result.user;

      return res.redirect('/dashboard');
    } catch (error) {
      return res.redirect('/login?error=invalid_credentials');
    }
  }

  @Get('logout')
  @Redirect('/login')
  logout(@Session() session: Record<string, any>) {
    session.user = null;
    return { url: '/login' };
  }
}
