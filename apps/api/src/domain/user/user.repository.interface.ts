import { User } from './user.entity';

/**
 * User Repository Interface
 */
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
}

/**
 * Injection token for User Repository
 */
export const IUserRepository = Symbol('IUserRepository');
