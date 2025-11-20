#!/usr/bin/env node

/**
 * Cross-platform Database Reset Runner
 * Automatically detects OS and runs the appropriate reset script
 */

const { execSync } = require('child_process');
const os = require('os');

console.log('⚠️  Starting B2B E-Commerce Database Reset...');
console.log('============================================');
console.log('This will permanently delete all data in the database!');

try {
  if (os.platform() === 'win32') {
    console.log('🖥️  Detected Windows - Running Windows reset...');
    execSync('bash scripts/reset-database.sh', { stdio: 'inherit' });
  } else {
    console.log('🐧 Detected Unix/Linux/Mac - Running Bash reset...');
    execSync('bash scripts/reset-database.sh', { stdio: 'inherit' });
  }
} catch (error) {
  console.error('❌ Database reset failed:', error.message);
  process.exit(1);
}
