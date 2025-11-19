#!/usr/bin/env node

/**
 * Cross-platform Database Setup Runner
 * Automatically detects OS and runs the appropriate setup script
 */

const { execSync } = require('child_process');
const os = require('os');

console.log('🚀 Starting B2B E-Commerce Database Setup...');
console.log('==========================================');

try {
  if (os.platform() === 'win32') {
    console.log('🖥️  Detected Windows - Running Windows setup...');
    execSync('scripts\\setup-database.bat', { stdio: 'inherit' });
  } else {
    console.log('🐧 Detected Unix/Linux/Mac - Running Bash setup...');
    execSync('bash scripts/setup-database.sh', { stdio: 'inherit' });
  }
} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  process.exit(1);
}
