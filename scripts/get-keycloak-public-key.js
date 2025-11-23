#!/usr/bin/env node

/**
 * Script to fetch Keycloak public key from the realm endpoint
 *
 * Usage:
 *   node scripts/get-keycloak-public-key.js
 *   node scripts/get-keycloak-public-key.js http://localhost:8080 b2b-ecommerce
 */

const http = require('http');
const https = require('https');

const KEYCLOAK_URL = process.argv[2] || process.env.KEYCLOAK_URL || 'http://localhost:8080';
const REALM = process.argv[3] || process.env.KEYCLOAK_REALM || 'b2b-ecommerce';

const realmUrl = `${KEYCLOAK_URL}/realms/${REALM}`;

console.log(`🔍 Fetching public key from Keycloak...`);
console.log(`   URL: ${realmUrl}\n`);

const client = realmUrl.startsWith('https') ? https : http;

client.get(realmUrl, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error(`❌ Error: Received status code ${res.statusCode}`);
      console.error(`   Make sure Keycloak is running at ${KEYCLOAK_URL}`);
      process.exit(1);
    }

    try {
      const realmInfo = JSON.parse(data);
      const publicKey = realmInfo.public_key;

      if (!publicKey) {
        console.error(`❌ Error: Public key not found in realm info`);
        process.exit(1);
      }

      console.log(`✅ Public key retrieved successfully!\n`);
      console.log(`📋 Add this to your .env file:\n`);
      console.log(`KEYCLOAK_PUBLIC_KEY=${publicKey}\n`);

      // Also show formatted version
      console.log(`📋 Or formatted with line breaks:\n`);
      const formattedKey = publicKey.match(/.{1,64}/g)?.join('\n') || publicKey;
      console.log(`KEYCLOAK_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n${formattedKey}\n-----END PUBLIC KEY-----`);

      console.log(`\n💡 Tip: Copy the KEYCLOAK_PUBLIC_KEY value to your .env file`);
      console.log(`   Then restart your application.`);

    } catch (error) {
      console.error(`❌ Error parsing response:`, error.message);
      process.exit(1);
    }
  });
}).on('error', (error) => {
  console.error(`❌ Error fetching public key:`, error.message);
  console.error(`\n   Make sure:`);
  console.error(`   1. Keycloak is running at ${KEYCLOAK_URL}`);
  console.error(`   2. The realm "${REALM}" exists`);
  console.error(`   3. You can access Keycloak from this machine\n`);
  process.exit(1);
});

