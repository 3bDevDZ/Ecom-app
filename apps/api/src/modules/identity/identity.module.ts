import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

/**
 * Identity Module (Bounded Context)
 * 
 * Responsibilities:
 * - User authentication via Keycloak (OAuth 2.0 + PKCE)
 * - JWT token validation and refresh
 * - Session management
 * - Role-based access control (Buyer, Seller, Admin)
 * - User profile synchronization with Keycloak
 */
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change-me-in-production',
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      },
    }),
  ],
  controllers: [
    // KeycloakAuthController will be added in T012
  ],
  providers: [
    // KeycloakStrategy, JwtStrategy, SessionService will be added later
  ],
  exports: [
    // Guards and decorators will be exported later
  ],
})
export class IdentityModule {}

