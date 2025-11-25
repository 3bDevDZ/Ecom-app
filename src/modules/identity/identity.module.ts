import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Services
import { KeycloakAuthService } from './application/services/keycloak-auth.service';

// Strategies
import { JwtStrategy } from './application/strategies/jwt.strategy';
import { KeycloakStrategy } from './application/strategies/keycloak.strategy';

// Guards
import { JwtAuthGuard } from './application/guards/jwt-auth.guard';
import { KeycloakAuthGuard } from './application/guards/keycloak-auth.guard';
import { RolesGuard } from './application/guards/roles.guard';

// Controllers - API
import { AuthController } from './presentation/controllers/auth.controller';
// Controllers - Views
import { AuthViewController } from './presentation/controllers/auth-view.controller';

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
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'change-me-in-production',
        signOptions: {
          expiresIn: parseInt(process.env.JWT_EXPIRES_IN ?? '3600', 10),
        },
      }),
    }),
  ],
  controllers: [
    // API Controller (with /api prefix)
    AuthController,
    // View Controller (without prefix)
    AuthViewController,
  ],
  providers: [
    // Services
    KeycloakAuthService,

    // Strategies
    JwtStrategy,
    KeycloakStrategy,

    // Guards
    JwtAuthGuard,
    KeycloakAuthGuard,
    RolesGuard,
  ],
  exports: [
    KeycloakAuthService,
    JwtAuthGuard,
    KeycloakAuthGuard,
    RolesGuard,
    PassportModule,
    JwtModule,
  ],
})
export class IdentityModule { }
