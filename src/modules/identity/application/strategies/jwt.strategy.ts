import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * JWT Strategy for Passport
 *
 * Validates JWT tokens from Keycloak
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    //private readonly keycloakAuthService: KeycloakAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
      algorithms: ['RS256'],
    });
  }

  /**
   * Validate JWT payload
   */
  async validate(payload: any) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Extract user information from JWT
    return {
      id: payload.sub,
      email: payload.email,
      username: payload.preferred_username,
      name: payload.name,
      roles: payload.realm_access?.roles || [],
      clientRoles:
        payload.resource_access?.[this.configService.getOrThrow<string>('keycloak.clientId')]
          ?.roles || [],
    };
  }
}
