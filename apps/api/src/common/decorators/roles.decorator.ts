import { SetMetadata } from '@nestjs/common';

/**
 * Roles Decorator
 * 
 * Sets required roles for route access control
 * Usage: @Roles('buyer', 'seller', 'admin')
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

