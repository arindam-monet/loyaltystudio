import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Building API...');

// Run TypeScript compiler
console.log('Compiling TypeScript...');
try {
  execSync('tsc', { stdio: 'inherit' });
} catch (error) {
  console.error('TypeScript compilation failed:', error);
  process.exit(1);
}

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Copy Prisma directory to dist
console.log('Copying Prisma files to dist...');
const prismaDest = path.join('dist', 'prisma');
if (!fs.existsSync(prismaDest)) {
  fs.mkdirSync(prismaDest, { recursive: true });
}

// Copy all files from prisma directory
const copyDir = (src, dest) => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${srcPath} to ${destPath}`);
    }
  }
};

copyDir('prisma', prismaDest);

console.log('Build completed successfully!');
