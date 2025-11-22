import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * JWT Strategy for Passport
 *
 * Validates JWT tokens from Keycloak
 * Supports both session-based tokens (for HTML views) and Bearer tokens (for API)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
  ) {
    // Get Keycloak configuration
    const keycloakPublicKey = configService.get<string>('keycloak.publicKey');
    const keycloakUrl = configService.get<string>('keycloak.url');
    const keycloakRealm = configService.get<string>('keycloak.realm');

    // Determine secret/key for JWT verification
    let secretOrKey: string | undefined;

    // For Keycloak tokens (RS256), we need the public key
    if (keycloakPublicKey && keycloakPublicKey.trim()) {
      // Use configured public key (format it properly if needed)
      secretOrKey = keycloakPublicKey.startsWith('-----BEGIN')
        ? keycloakPublicKey
        : `-----BEGIN PUBLIC KEY-----\n${keycloakPublicKey.replace(/(.{64})/g, '$1\n').trim()}\n-----END PUBLIC KEY-----`;
    } else {
      // Fallback: Use JWT_SECRET or a development secret
      // This allows the app to start even without Keycloak configured
      secretOrKey = configService.get<string>('JWT_SECRET') || 'development-secret-change-in-production-warning';
    }

    // If no secret/key is available, passport-jwt will throw an error
    // So we always provide at least a fallback secret
    if (!secretOrKey) {
      secretOrKey = 'development-secret-change-in-production-warning';
    }

    super({
      jwtFromRequest: (request: any) => {
        // First, try to get from Authorization header (Bearer token)
        const authHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
        if (authHeader) {
          return authHeader;
        }

        // If no Authorization header, try to get from session (for HTML views)
        if (request.session?.accessToken) {
          return request.session.accessToken;
        }

        return null;
      },
      ignoreExpiration: false,
      secretOrKey: secretOrKey,
      // For Keycloak, use RS256 if public key is configured, otherwise HS256
      algorithms: keycloakPublicKey ? ['RS256'] : ['HS256'],
      // Add issuer validation if Keycloak is configured
      ...(keycloakUrl && keycloakRealm && {
        issuer: `${keycloakUrl}/realms/${keycloakRealm}`,
        audience: configService.get<string>('keycloak.clientId'),
      }),
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
