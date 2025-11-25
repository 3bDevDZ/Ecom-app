import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { KeycloakAuthService } from '../services/keycloak-auth.service';

/**
 * JWT Auth Guard
 *
 * Protects routes with JWT authentication
 * Supports both session-based auth (from ViewUserMiddleware) and Bearer token auth
 * Allows public routes with @Public() decorator
 * Automatically refreshes expired tokens when refresh token is available
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private readonly keycloakAuthService: KeycloakAuthService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Check if user is already authenticated via session (from ViewUserMiddleware)
    // This happens when accessing HTML routes with session-based auth
    if (request.user && (request.user.userId || request.user.sub || request.user.id)) {
      return true;
    }

    // Check if session has access token - try to refresh if expired
    if (request.session?.accessToken) {
      try {
        // Decode token to check expiration
        const tokenParts = request.session.accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(tokenParts[1], 'base64url').toString('utf-8')
          );
          const currentTime = Math.floor(Date.now() / 1000);
          const expiresIn = payload.exp ? payload.exp - currentTime : 0;

          // If token expires in less than 60 seconds, try to refresh
          if (expiresIn < 60 && request.session?.refreshToken) {
            try {
              const tokens = await this.keycloakAuthService.refreshToken(
                request.session.refreshToken
              );
              request.session.accessToken = tokens.access_token;
              if (tokens.refresh_token) {
                request.session.refreshToken = tokens.refresh_token;
              }
              if (tokens.id_token) {
                request.session.idToken = tokens.id_token;
              }
            } catch (refreshError) {
              // Refresh failed - will be handled by handleRequest
            }
          }
        }
      } catch (error) {
        // Token decode failed - will be handled by handleRequest
      }
    }

    // Check if session has access token or Bearer token - if so, try to authenticate with it
    // The JWT strategy will extract it from session (see jwt.strategy.ts line 54)
    // If no session token or Bearer token, let super.canActivate handle the error
    if (request.session?.accessToken || request.headers?.authorization?.startsWith('Bearer ')) {
      return super.canActivate(context) as Promise<boolean>;
    }

    // No authentication method found
    throw new UnauthorizedException('Authentication required. Please log in.');
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context?.switchToHttp?.()?.getRequest() ||
      (typeof arguments[2] !== 'undefined' && arguments[2]?.req) ||
      (typeof arguments[3] !== 'undefined' && arguments[3]?.req);

    // If Passport authentication failed, check for session-based user
    if ((err || !user || info) && request?.user && (request.user.userId || request.user.sub || request.user.id)) {
      return request.user;
    }

    // Also check if session has access token but user wasn't set properly
    if ((err || !user) && request?.session?.accessToken) {
      try {
        // Decode JWT from session and create user object
        const tokenParts = request.session.accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString('utf-8'));
          if (payload && payload.sub) {
            return {
              userId: payload.sub,
              sub: payload.sub,
              id: payload.sub,
              email: payload.email || '',
              username: payload.preferred_username || payload.email || 'user',
              name: payload.name || payload.preferred_username || payload.email || 'User',
              roles: payload.realm_access?.roles || [],
            };
          }
        }
      } catch (decodeError) {
        // Ignore decode errors, continue to throw auth error
      }
    }

    // Otherwise, throw error if authentication failed
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required. Please log in.');
    }

    return user;
  }
}

