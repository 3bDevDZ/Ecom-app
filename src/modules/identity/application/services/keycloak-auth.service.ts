import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { JwtService } from '@nestjs/jwt';
import { getErrorDetails } from '@common/utils/error.util';

/**
 * Keycloak Authentication Service
 *
 * Handles authentication with Keycloak using OAuth 2.0 Authorization Code Flow with PKCE
 */
@Injectable()
export class KeycloakAuthService {
  private readonly logger = new Logger(KeycloakAuthService.name);
  private readonly keycloakUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly callbackUrl: string;
  private keycloakAdmin: KeycloakAdminClient | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.keycloakUrl = this.configService.getOrThrow<string>('keycloak.url');
    this.realm = this.configService.getOrThrow<string>('keycloak.realm');
    this.clientId = this.configService.getOrThrow<string>('keycloak.clientId');
    this.clientSecret = this.configService.getOrThrow<string>('keycloak.clientSecret');
    this.callbackUrl = this.configService.getOrThrow<string>('keycloak.callbackUrl');

    this.initializeKeycloakAdmin();
  }

  /**
   * Initialize Keycloak Admin Client
   */
  private async initializeKeycloakAdmin(): Promise<void> {
    try {
      this.keycloakAdmin = new KeycloakAdminClient({
        baseUrl: this.keycloakUrl,
        realmName: this.realm,
      });

      // Authenticate with client credentials if available
      if (this.clientSecret) {
        await this.keycloakAdmin.auth({
          grantType: 'client_credentials',
          clientId: this.clientId,
          clientSecret: this.clientSecret,
        });
      }

      this.logger.log('Keycloak Admin Client initialized');
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error('Failed to initialize Keycloak Admin Client', message, stack);
    }
  }

  /**
   * Generate authorization URL for OAuth 2.0 Authorization Code Flow with PKCE
   */
  generateAuthUrl(state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      response_type: 'code',
      scope: 'openid profile email',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: this.clientId,
            code,
            redirect_uri: this.callbackUrl,
            code_verifier: codeVerifier,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        this.logger.error('Token exchange failed', error);
        throw new UnauthorizedException('Failed to exchange authorization code');
      }

      return await response.json();
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error('Token exchange error', message, stack);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: this.clientId,
            refresh_token: refreshToken,
          }),
        },
      );

      if (!response.ok) {
        throw new UnauthorizedException('Failed to refresh token');
      }

      return await response.json();
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error('Token refresh error', message, stack);
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.decode(token, { complete: true });

      if (!decoded) {
        throw new UnauthorizedException('Invalid token');
      }

      // Verify with Keycloak userinfo endpoint
      const userInfo = await this.getUserInfo(token);
      return userInfo;
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error('Token validation error', message, stack);
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Get user information from Keycloak
   */
  async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new UnauthorizedException('Failed to get user info');
      }

      return await response.json();
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error('Get user info error', message, stack);
      throw new UnauthorizedException('Failed to retrieve user information');
    }
  }

  /**
   * Generate logout URL
   */
  generateLogoutUrl(redirectUri?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      post_logout_redirect_uri: redirectUri || this.callbackUrl,
    });

    return `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout?${params.toString()}`;
  }

  /**
   * Get user roles from Keycloak
   */
  async getUserRoles(userId: string): Promise<string[]> {
    try {
      if (!this.keycloakAdmin) {
        this.logger.error('Keycloak Admin Client is not initialized');
        return [];
      }

      const user = await this.keycloakAdmin.users.findOne({ id: userId });

      if (!user) {
        return [];
      }

      // Get client roles
      const clientRoles = await this.keycloakAdmin.users.listClientRoleMappings({
        id: userId,
        clientUniqueId: this.clientId,
      });

      return clientRoles.map((role) => role.name || '');
    } catch (error) {
      const { message, stack } = getErrorDetails(error);
      this.logger.error('Get user roles error', message, stack);
      return [];
    }
  }
}
