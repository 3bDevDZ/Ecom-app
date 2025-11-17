import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/user.repository.interface';

/**
 * Login Use Case
 */
@Injectable()
export class LoginUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // For demo purposes, accept 'password123' for any user
    // In production, use bcrypt to compare hashed passwords
    if (password !== 'password123') {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      success: true,
      user: {
        id: user.getId(),
        email: user.getEmail(),
        name: user.getName(),
      },
      message: 'Login successful',
    };
  }
}
