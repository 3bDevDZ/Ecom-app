import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Keycloak Auth Guard
 * 
 * Protects routes with Keycloak authentication
 */
@Injectable()
export class KeycloakAuthGuard extends AuthGuard('keycloak') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}

