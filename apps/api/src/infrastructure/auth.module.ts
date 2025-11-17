import { Module } from '@nestjs/common';
import { AuthController } from './http/auth.controller';
import { LoginUseCase } from '../application/auth/use-cases/login.use-case';
import { InMemoryUserRepository } from './persistence/in-memory-user.repository';
import { USER_REPOSITORY } from './tokens';

@Module({
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: InMemoryUserRepository,
    },
  ],
  exports: [LoginUseCase, USER_REPOSITORY],
})
export class AuthModule {}
