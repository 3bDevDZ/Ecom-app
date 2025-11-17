import { Module } from '@nestjs/common';
import { AuthController } from './http/auth.controller';
import { LoginUseCase } from '../application/auth/use-cases/login.use-case';
import { InMemoryUserRepository } from './persistence/in-memory-user.repository';
import { IUserRepository } from '../domain/user/user.repository.interface';

@Module({
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    {
      provide: IUserRepository,
      useClass: InMemoryUserRepository,
    },
  ],
  exports: [LoginUseCase],
})
export class AuthModule {}
