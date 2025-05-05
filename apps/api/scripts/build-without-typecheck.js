import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Copy all TypeScript files to dist directory and change extension to .js
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts') && !entry.name.endsWith('.test.ts')) {
      // Copy TypeScript files (excluding declaration and test files) and change extension to .js
      const destFile = destPath.replace(/\.ts$/, '.js');
      fs.copyFileSync(srcPath, destFile);
      console.log(`Copied ${srcPath} to ${destFile}`);
    } else if (!entry.name.endsWith('.test.ts')) {
      // Copy other files as is (excluding test files)
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${srcPath} to ${destPath}`);
    }
  }
}

// Copy src directory to dist
copyDir('src', 'dist');

// Copy trigger.config.ts to dist and rename to .js
if (fs.existsSync('trigger.config.ts')) {
  fs.copyFileSync('trigger.config.ts', 'dist/trigger.config.js');
  console.log('Copied trigger.config.ts to dist/trigger.config.js');
}

console.log('Build completed successfully!');
