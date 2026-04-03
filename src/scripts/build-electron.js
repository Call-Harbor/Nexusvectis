/* eslint-disable no-undef */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Build React app first
console.log('Building React app...');
execSync('npm run build', { stdio: 'inherit' });

// Copy electron files to dist
console.log('Copying Electron files...');
const distDir = path.join(__dirname, '../dist');
fs.copyFileSync(
  path.join(__dirname, '../public/electron.js'),
  path.join(distDir, 'electron.js')
);
fs.copyFileSync(
  path.join(__dirname, '../public/preload.js'),
  path.join(distDir, 'preload.js')
);

// Build with electron-builder
console.log('Building Electron app...');
execSync('electron-builder', { stdio: 'inherit' });

console.log('✅ Build complete! Check dist_electron/ for installers.');