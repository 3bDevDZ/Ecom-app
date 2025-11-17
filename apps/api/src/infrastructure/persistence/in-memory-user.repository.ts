import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/user/user.repository.interface';
import { User } from '../../domain/user/user.entity';

/**
 * In-Memory User Repository
 */
@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  constructor() {
    this.seedMockData();
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return (
      Array.from(this.users.values()).find(
        (user) => user.getEmail().toLowerCase() === email.toLowerCase()
      ) ?? null
    );
  }

  async save(user: User): Promise<User> {
    this.users.set(user.getId(), user);
    return user;
  }

  async update(user: User): Promise<User> {
    this.users.set(user.getId(), user);
    return user;
  }

  private seedMockData(): void {
    // Demo user: email: john.doe@example.com, password: password123
    const demoUser = User.create({
      id: 'user-001',
      email: 'john.doe@example.com',
      password: '$2a$10$qQXqYN0tKcKZZ0Jk7Z8QXe5M0Z8QXe5M0Z8QXe5M0Z8QXe5M0Z8QXe', // hashed 'password123'
      name: 'John Doe',
      phone: '+1-555-0123',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });

    this.users.set(demoUser.getId(), demoUser);
  }
}
