import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { KeycloakAuthService } from '../services/keycloak-auth.service';

/**
 * Keycloak Strategy for Passport
 * 
 * Custom strategy for handling Keycloak OAuth 2.0 flow
 */
@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor(private readonly keycloakAuthService: KeycloakAuthService) {
    super();
  }

  /**
   * Validate request with Keycloak
   */
  async validate(req: Request): Promise<any> {
    const token = this.extractTokenFromHeader(req);

    if (!token) {
      return null;
    }

    // Validate token with Keycloak
    const userInfo = await this.keycloakAuthService.validateToken(token);

    return {
      id: userInfo.sub,
      email: userInfo.email,
      username: userInfo.preferred_username,
      name: userInfo.name,
      roles: userInfo.realm_access?.roles || [],
    };
  }

  /**
   * Extract JWT token from Authorization header
   */
  private extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}

