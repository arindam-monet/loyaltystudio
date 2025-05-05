#!/usr/bin/env node

// This script helps Vercel build the Next.js app in a monorepo context
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Log the current directory
console.log('Current directory:', process.cwd());

try {
  // Copy the vercel-package.json to package.json for Vercel to detect Next.js
  if (fs.existsSync(path.join(process.cwd(), 'vercel-package.json'))) {
    console.log('Copying vercel-package.json to package.json...');
    fs.copyFileSync(
      path.join(process.cwd(), 'vercel-package.json'),
      path.join(process.cwd(), 'package.json')
    );
  }

  // Navigate to the root of the monorepo
  process.chdir(path.join(__dirname, '../..'));
  console.log('Changed to monorepo root:', process.cwd());

  // Install dependencies
  console.log('Installing dependencies...');
  execSync('pnpm install', { stdio: 'inherit' });

  // Build the merchant-web app
  console.log('Building merchant-web app...');
  execSync('pnpm merchant:build', { stdio: 'inherit' });

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
