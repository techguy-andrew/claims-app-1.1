#!/usr/bin/env node

/**
 * Fix all imports in _barron-agency components to use relative paths
 * This makes the components truly self-contained
 */

const fs = require('fs');
const path = require('path');

// Map old imports to new relative imports
const importMappings = {
  // Icons
  '@/app/icons/': '../icons/',

  // Components
  '@/app/components/': './',

  // Types
  '@/types': '../types',

  // Hooks
  '@/lib/hooks/': '../hooks/',

  // Config
  '@/config/': '../config/',
};

// Directory to process
const componentsDir = path.join(__dirname, '..', 'components');
const iconsDir = path.join(__dirname, '..', 'icons');
const hooksDir = path.join(__dirname, '..', 'hooks');

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Apply each import mapping
  for (const [oldPath, newPath] of Object.entries(importMappings)) {
    if (content.includes(oldPath)) {
      const regex = new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      content = content.replace(regex, newPath);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed imports in: ${path.basename(filePath)}`);
    return true;
  }

  return false;
}

function processDirectory(dir, dirName) {
  if (!fs.existsSync(dir)) {
    console.log(`⚠️  Directory not found: ${dir}`);
    return;
  }

  console.log(`\n📁 Processing ${dirName}...`);
  const files = fs.readdirSync(dir);
  let fixedCount = 0;

  files.forEach(file => {
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const filePath = path.join(dir, file);
      if (fixImportsInFile(filePath)) {
        fixedCount++;
      }
    }
  });

  if (fixedCount === 0) {
    console.log(`ℹ️  No imports needed fixing in ${dirName}`);
  } else {
    console.log(`✨ Fixed ${fixedCount} files in ${dirName}`);
  }
}

console.log('🔧 Fixing imports in _barron-agency components...\n');

// Process each directory
processDirectory(componentsDir, 'components');
processDirectory(iconsDir, 'icons');
processDirectory(hooksDir, 'hooks');

console.log('\n✅ Import fixing complete!');
console.log('\nThe _barron-agency folder is now truly self-contained.');
console.log('Components import from each other using relative paths.');