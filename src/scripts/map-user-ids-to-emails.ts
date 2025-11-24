import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { config } from 'dotenv';

config();

/**
 * Map User IDs to Emails
 *
 * Shows which Keycloak user IDs correspond to which emails.
 */

async function mapUserIdsToEmails() {
  const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
  const realm = process.env.KEYCLOAK_REALM || 'b2b-ecommerce';
  const adminUser = process.env.KEYCLOAK_ADMIN_USER || 'admin';
  const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';

  try {
    const keycloakAdmin = new KeycloakAdminClient({
      baseUrl: keycloakUrl,
      realmName: 'master',
    });

    await keycloakAdmin.auth({
      grantType: 'password',
      clientId: 'admin-cli',
      username: adminUser,
      password: adminPassword,
    });

    keycloakAdmin.setConfig({
      realmName: realm,
    });

    const users = await keycloakAdmin.users.find({ max: 100 });

    console.log('🔐 Keycloak Users and their IDs:\n');
    console.log('='.repeat(80));

    users.forEach(user => {
      console.log(`\n📧 Email/Username: ${user.email || user.username}`);
      console.log(`   👤 Username: ${user.username}`);
      console.log(`   🆔 User ID: ${user.id}`);
      console.log(`   📛 Name: ${user.firstName || ''} ${user.lastName || ''}`.trim());
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n💡 Use these user IDs to match with orders in the database.');

  } catch (error: any) {
    console.error('❌ Error:', error.message || error);
    throw error;
  }
}

mapUserIdsToEmails()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

