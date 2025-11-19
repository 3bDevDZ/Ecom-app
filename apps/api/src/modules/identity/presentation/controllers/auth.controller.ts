import { Controller, Get, Query, Res, Req, Session, UseGuards, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { KeycloakAuthService } from '../../application/services/keycloak-auth.service';
import { JwtAuthGuard } from '../../application/guards/jwt-auth.guard';
import { User } from '@common/decorators/user.decorator';
import * as crypto from 'crypto';
import { getErrorDetails } from '@common/utils/error.util';

/**
 * Authentication Controller
 *
 * Handles Keycloak OAuth 2.0 authentication flow with PKCE
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly keycloakAuthService: KeycloakAuthService) {}

  /**
   * Initiate login - redirect to Keycloak
   * GET /api/auth/login
   */
  @Get('login')
  async login(@Res() res: Response, @Session() session: Record<string, any>) {
    try {
      // Generate PKCE code verifier and challenge
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = this.generateCodeChallenge(codeVerifier);

      // Generate state for CSRF protection
      const state = crypto.randomBytes(32).toString('hex');

      // Store in session
      session.codeVerifier = codeVerifier;
      session.state = state;

      // Generate authorization URL
      const authUrl = this.keycloakAuthService.generateAuthUrl(state, codeChallenge);

      this.logger.log('Redirecting to Keycloak for authentication');
      return res.redirect(authUrl);
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error('Login error', message, stack);
      return res.status(500).json({ message: 'Authentication failed' });
    }
  }

  /**
   * OAuth callback - handle authorization code
   * GET /api/auth/callback
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
    @Session() session: Record<string, any>,
  ) {
    try {
      // Verify state to prevent CSRF
      if (!session.state || session.state !== state) {
        this.logger.error('State mismatch - potential CSRF attack');
        return res.status(403).json({ message: 'Invalid state parameter' });
      }

      // Verify code verifier exists
      if (!session.codeVerifier) {
        this.logger.error('Code verifier not found in session');
        return res.status(400).json({ message: 'Invalid session' });
      }

      // Exchange authorization code for tokens
      const tokens = await this.keycloakAuthService.exchangeCodeForTokens(
        code,
        session.codeVerifier,
      );

      // Store tokens in session
      session.accessToken = tokens.access_token;
      session.refreshToken = tokens.refresh_token;
      session.idToken = tokens.id_token;

      // Clear PKCE data
      delete session.codeVerifier;
      delete session.state;

      this.logger.log('User authenticated successfully');

      // Redirect to dashboard or home
      return res.redirect('/dashboard');
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error('Callback error', message, stack);
      return res.redirect('/login?error=auth_failed');
    }
  }

  /**
   * Logout - clear session and redirect to Keycloak logout
   * GET /api/auth/logout
   */
  @Get('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      // Generate logout URL
      const logoutUrl = this.keycloakAuthService.generateLogoutUrl(
        req.protocol + '://' + req.get('host'),
      );

      // Clear session
      req.session?.destroy((err: unknown) => {
        if (err) {
          const { message, stack } = getErrorDetails(err);
          this.logger.error('Session destruction  error', message, stack);
        }
      });

      this.logger.log('User logged out successfully');
      return res.redirect(logoutUrl);
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error('Logout error', message, stack);
      return res.redirect('/');
    }
  }

  /**
   * Refresh token endpoint
   * GET /api/auth/refresh
   */
  @Get('refresh')
  async refresh(@Session() session: Record<string, any>, @Res() res: Response) {
    try {
      if (!session.refreshToken) {
        return res.status(401).json({ message: 'No refresh token available' });
      }

      // Refresh tokens
      const tokens = await this.keycloakAuthService.refreshToken(session.refreshToken);

      // Update session
      session.accessToken = tokens.access_token;
      if (tokens.refresh_token) {
        session.refreshToken = tokens.refresh_token;
      }

      this.logger.log('Token refreshed successfully');
      return res.json({ message: 'Token refreshed' });
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error('Token refresh error', message, stack);
      return res.status(401).json({ message: 'Token refresh failed' });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@User() user: any) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      roles: user.roles,
      clientRoles: user.clientRoles,
    };
  }

  /**
   * Generate PKCE code verifier
   */
  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  private generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }
}
