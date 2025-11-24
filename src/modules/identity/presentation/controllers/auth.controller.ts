import { User } from '@common/decorators/user.decorator';
import { getErrorDetails } from '@common/utils/error.util';
import { Controller, Get, Logger, Query, Req, Res, Session, UseGuards } from '@nestjs/common';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../application/guards/jwt-auth.guard';
import { KeycloakAuthService } from '../../application/services/keycloak-auth.service';

/**
 * Authentication Controller
 *
 * Handles Keycloak OAuth 2.0 authentication flow with PKCE
 */
@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly keycloakAuthService: KeycloakAuthService) { }

  /**
   * Initiate login - redirect to Keycloak
   * GET /api/auth/login
   * GET /login (for HTML view)
   */
  @Get('login')
  async login(
    @Query('format') format?: string,
    @Query('action') action?: string,
    @Req() req?: Request,
    @Res() res?: Response,
    @Session() session?: Record<string, any>,
  ) {
    // Check if user is already authenticated
    if (session?.accessToken) {
      // If HTML request, redirect to home
      if (res && (format === 'html' || !format)) {
        return res.redirect('/');
      }
      // If API request, return profile
      return { message: 'Already authenticated' };
    }

    // Check if this is a form submission (button clicked) - query param action=login
    const isFormSubmission = action === 'login' || req?.query?.action === 'login';

    // Check if this is an HTML request (show login page)
    // Only show login page if it's NOT a form submission
    const isHtmlRequest =
      !isFormSubmission &&
      (format === 'html' ||
        (res && res.req.headers.accept?.includes('text/html')) ||
        (res && !res.req.headers.accept?.includes('application/json')));

    if (isHtmlRequest && res) {
      // Render login page
      return res.render('login', {
        query: res.req.query || {},
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Login' },
        ],
      });
    }

    // API request or form submission - redirect to Keycloak
    if (!res) {
      this.logger.error('Response not available for Keycloak redirect');
      return { message: 'Response not available' };
    }

    // Ensure session exists (it will be created by express-session middleware)
    if (!session) {
      this.logger.error('Session not available - session middleware may not be configured correctly');
      return res.status(500).render('login', {
        query: { ...res.req.query, error: 'session_error' },
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Login' },
        ],
      });
    }

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

      this.logger.log(`Redirecting to Keycloak for authentication: ${authUrl}`);
      return res.redirect(authUrl);
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error('Login error', message, stack);
      return res?.status(500).json({ message: 'Authentication failed' });
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

      // Redirect to home page (or original destination if stored)
      return res.redirect('/');
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error('Callback error', message, stack);
      return res.redirect('/login?error=auth_failed');
    }
  }

  /**
   * Logout - clear session and redirect to home
   * GET /api/auth/logout
   * GET /logout (for HTML view)
   *
   * Note: Removed @UseGuards(JwtAuthGuard) so users can logout even if already logged out
   */
  @Get('logout')
  async logout(@Req() req: Request, @Res() res: Response, @Session() session?: Record<string, any>) {
    try {
      // If user has tokens, try to logout from Keycloak first
      if (session?.accessToken || session?.refreshToken) {
        try {
          // Try to logout from Keycloak (but don't fail if it doesn't work)
          if (session.refreshToken) {
            await this.keycloakAuthService.logout(session.refreshToken).catch(() => {
              // Ignore errors - we still want to clear local session
            });
          }
        } catch (error) {
          // Ignore Keycloak logout errors - we still clear local session
          this.logger.warn('Keycloak logout failed, clearing local session anyway');
        }
      }

      // Destroy local session
      return new Promise<void>((resolve) => {
        if (req.session) {
          req.session.destroy((err: unknown) => {
            if (err) {
              const { message, stack } = getErrorDetails(err);
              this.logger.error('Session destruction error', message, stack);
            } else {
              this.logger.log('Session destroyed successfully');
            }
            // Always redirect, even if session destruction failed
            res.redirect('/');
            resolve();
          });
        } else {
          // No session to destroy, just redirect
          res.redirect('/');
          resolve();
        }
      });
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error('Logout error', message, stack);
      // Always redirect on error
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
