import { registerAs } from '@nestjs/config';

export default registerAs('keycloak', () => ({
  url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.KEYCLOAK_REALM || 'b2b-ecommerce',
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'ecommerce-app',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
  publicKey: process.env.KEYCLOAK_PUBLIC_KEY || '',
  callbackUrl: process.env.KEYCLOAK_CALLBACK_URL || 'http://localhost:3333/api/auth/callback',
}));

