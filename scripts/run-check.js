#!/usr/bin/env node

/**
 * Cross-platform Database Check Runner
 * Automatically detects OS and runs the appropriate check script
 */

const { execSync } = require('child_process');
const os = require('os');

console.log('🔍 Running Database Setup Verification...');
console.log('========================================');

try {
  if (os.platform() === 'win32') {
    console.log('🖥️  Detected Windows - Running Windows script...');
    execSync('scripts\\check-database.bat', { stdio: 'inherit' });
  } else {
    console.log('🐧 Detected Unix/Linux/Mac - Running Bash script...');
    execSync('bash scripts/check-database.sh', { stdio: 'inherit' });
  }
} catch (error) {
  console.error('❌ Database check failed:', error.message);
  process.exit(1);
}
