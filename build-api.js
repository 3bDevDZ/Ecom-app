#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

console.log('Building API...');

// Change to the api directory
process.chdir(path.join(__dirname, 'apps', 'api'));

// Run the build command
try {
  execSync('npx nest build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
