import { Controller, Get, Query, Req, Res, Session } from '@nestjs/common';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import { KeycloakAuthService } from '../../application/services/keycloak-auth.service';

/**
 * AuthViewController
 *
 * Handles HTML view rendering for authentication pages.
 * Separate from AuthController (API) for proper separation of concerns.
 *
 * Routes:
 * - GET /login - Login page
 * - GET /logout - Logout (redirects)
 * - GET /callback - OAuth callback (redirects)
 */
@Controller()
export class AuthViewController {
  constructor(private readonly keycloakAuthService: KeycloakAuthService) { }

  /**
   * Login page
   * GET /login
   */
  @Get('login')
  async login(
    @Query('format') format?: string,
    @Query('action') action?: string,
    @Query('error') error?: string,
    @Req() req?: Request,
    @Res() res?: Response,
    @Session() session?: Record<string, any>,
  ) {
    // Check if user is already authenticated
    if (session?.accessToken) {
      // Redirect to original page if stored, otherwise home
      const returnTo = session?.returnTo || '/';
      if (session.returnTo) {
        delete session.returnTo;
      }
      return res.redirect(returnTo);
    }

    // Check if this is a form submission (button clicked)
    const isFormSubmission = action === 'login' || req?.query?.action === 'login';

    if (isFormSubmission && res && session) {
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

      return res.redirect(authUrl);
    }

    // Show login page
    if (res) {
      return res.render('login', {
        query: { ...res.req.query, error },
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Login' },
        ],
      });
    }
  }

  /**
   * Logout
   * GET /logout
   */
  @Get('logout')
  async logout(
    @Req() req: Request,
    @Res() res: Response,
    @Session() session?: Record<string, any>,
  ) {
    // If user has tokens, try to logout from Keycloak first
    if (session?.accessToken || session?.refreshToken) {
      try {
        if (session.refreshToken) {
          await this.keycloakAuthService.logout(session.refreshToken).catch(() => {
            // Ignore errors
          });
        }
      } catch (error) {
        // Ignore Keycloak logout errors
      }
    }

    // Destroy local session
    return new Promise<void>((resolve) => {
      if (req.session) {
        req.session.destroy((err: unknown) => {
          res.redirect('/');
          resolve();
        });
      } else {
        res.redirect('/');
        resolve();
      }
    });
  }

  /**
   * OAuth callback
   * GET /callback
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
        return res.redirect('/login?error=invalid_state');
      }

      // Verify code verifier exists
      if (!session.codeVerifier) {
        return res.redirect('/login?error=invalid_session');
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

      // Redirect to original page if stored, otherwise home
      const returnTo = session.returnTo || '/';
      delete session.returnTo;
      return res.redirect(returnTo);
    } catch (error) {
      return res.redirect('/login?error=auth_failed');
    }
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

