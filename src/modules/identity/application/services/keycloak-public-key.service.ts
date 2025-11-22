import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Keycloak Public Key Service
 *
 * Fetches and caches the public key from Keycloak's realm endpoint
 * for JWT token verification.
 */
@Injectable()
export class KeycloakPublicKeyService implements OnModuleInit {
  private readonly logger = new Logger(KeycloakPublicKeyService.name);
  private cachedPublicKey: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    // Try to fetch public key on module initialization
    await this.getPublicKey();
  }

  /**
   * Get Keycloak public key for JWT verification
   * Tries in order:
   * 1. Environment variable KEYCLOAK_PUBLIC_KEY
   * 2. Fetch from Keycloak realm endpoint
   * 3. Return null (will skip verification)
   */
  async getPublicKey(): Promise<string | null> {
    // Return cached key if available
    if (this.cachedPublicKey) {
      return this.cachedPublicKey;
    }

    // Try environment variable first
    const envPublicKey = this.configService.get<string>('keycloak.publicKey');
    if (envPublicKey && envPublicKey.trim()) {
      this.cachedPublicKey = this.formatPublicKey(envPublicKey);
      this.logger.log('Using Keycloak public key from environment variable');
      return this.cachedPublicKey;
    }

    // Try to fetch from Keycloak realm endpoint
    const keycloakUrl = this.configService.get<string>('keycloak.url');
    const realm = this.configService.get<string>('keycloak.realm');

    if (keycloakUrl && realm) {
      try {
        const realmUrl = `${keycloakUrl}/realms/${realm}`;
        const response = await fetch(realmUrl);

        if (response.ok) {
          const realmInfo = await response.json();
          const publicKey = realmInfo.public_key;

          if (publicKey) {
            this.cachedPublicKey = this.formatPublicKey(publicKey);
            this.logger.log('Fetched Keycloak public key from realm endpoint');
            return this.cachedPublicKey;
          }
        }
      } catch (error: any) {
        this.logger.warn(
          `Failed to fetch public key from Keycloak: ${error.message || error}. ` +
          `Token verification will be skipped (development mode only).`
        );
      }
    }

    // Return null if no public key available (will skip verification)
    this.logger.warn(
      'No Keycloak public key configured. JWT verification will be skipped. ' +
      'Set KEYCLOAK_PUBLIC_KEY in .env or ensure Keycloak is running.'
    );
    return null;
  }

  /**
   * Format public key string to proper PEM format
   */
  private formatPublicKey(key: string): string {
    // Remove any existing headers/footers
    let cleanedKey = key.replace(/-----BEGIN PUBLIC KEY-----/g, '')
                        .replace(/-----END PUBLIC KEY-----/g, '')
                        .replace(/\s/g, '');

    // Add proper PEM headers if not present
    if (!key.includes('-----BEGIN PUBLIC KEY-----')) {
      // Split into 64-character lines
      const chunks = cleanedKey.match(/.{1,64}/g) || [];
      return `-----BEGIN PUBLIC KEY-----\n${chunks.join('\n')}\n-----END PUBLIC KEY-----`;
    }

    return key;
  }
}

