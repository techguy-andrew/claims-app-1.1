#!/usr/bin/env node

/**
 * Barron Agency Foundation - Smart Integration Script
 * Automatically integrates the agency foundation into a Next.js project
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}`),
};

// Configuration
const config = {
  sourceDir: path.resolve(__dirname, '..'),
  targetDir: path.resolve(__dirname, '../..'),
  folders: {
    components: 'app/components',
    icons: 'app/icons',
    styles: 'app/styles',
    hooks: 'lib/hooks',
    utils: 'lib',
    types: 'types',
    config: 'config',
  }
};

// Helper functions
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
}

function copyRecursive(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    ensureDir(dest);
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursive(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function updateLayoutFile() {
  const layoutPath = path.join(config.targetDir, 'app/layout.tsx');

  if (!fs.existsSync(layoutPath)) {
    log.warning('No app/layout.tsx found - skipping provider integration');
    return;
  }

  let layoutContent = fs.readFileSync(layoutPath, 'utf8');

  // Check if providers already imported
  if (layoutContent.includes('Providers')) {
    log.info('Providers already configured in layout.tsx');
    return;
  }

  // Add import statement
  const importStatement = `import { Providers } from "./providers";\n`;
  layoutContent = layoutContent.replace(
    /(import .* from ['"].*['"];?\n)+/,
    `$&${importStatement}`
  );

  // Wrap children with Providers
  layoutContent = layoutContent.replace(
    /(\s+)({children})/,
    `$1<Providers>$2</Providers>`
  );

  fs.writeFileSync(layoutPath, layoutContent);
  log.success('Updated app/layout.tsx with Providers');
}

function updateGlobalStyles() {
  const globalsPath = path.join(config.targetDir, 'app/globals.css');
  const themePath = path.join(config.sourceDir, 'styles/themes/default.css');

  if (!fs.existsSync(themePath)) {
    log.warning('No theme file found - skipping styles integration');
    return;
  }

  const themeContent = fs.readFileSync(themePath, 'utf8');

  if (fs.existsSync(globalsPath)) {
    let globalsContent = fs.readFileSync(globalsPath, 'utf8');

    // Check if already has design tokens
    if (globalsContent.includes('--primary:')) {
      log.info('Design tokens already configured in globals.css');
      return;
    }

    // Append theme content
    globalsContent += '\n\n/* Barron Agency Foundation - Design Tokens */\n' + themeContent;
    fs.writeFileSync(globalsPath, globalsContent);
  } else {
    // Create new globals.css
    const newContent = `@import "tailwindcss";\n\n/* Barron Agency Foundation - Design Tokens */\n${themeContent}`;
    fs.writeFileSync(globalsPath, newContent);
  }

  log.success('Updated globals.css with design tokens');
}

function createManifest() {
  const manifest = {
    version: '1.0.0',
    installedAt: new Date().toISOString(),
    components: {
      total: fs.readdirSync(path.join(config.sourceDir, 'components')).length,
      list: fs.readdirSync(path.join(config.sourceDir, 'components'))
        .filter(f => f.endsWith('.tsx'))
        .map(f => f.replace('.tsx', ''))
    },
    icons: {
      total: fs.readdirSync(path.join(config.sourceDir, 'icons')).length,
      list: fs.readdirSync(path.join(config.sourceDir, 'icons'))
        .filter(f => f.endsWith('.tsx'))
        .map(f => f.replace('.tsx', ''))
    },
    hooks: fs.readdirSync(path.join(config.sourceDir, 'hooks'))
      .filter(f => f.endsWith('.ts'))
      .map(f => f.replace('.ts', '')),
    themes: fs.readdirSync(path.join(config.sourceDir, 'styles/themes'))
      .filter(f => f.endsWith('.css'))
      .map(f => f.replace('.css', ''))
  };

  fs.writeFileSync(
    path.join(config.targetDir, 'barron-agency.manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  return manifest;
}

// Main integration function
async function integrate() {
  console.log(`
${colors.bright}╔════════════════════════════════════════════════╗
║   🚀 BARRON AGENCY FOUNDATION - INTEGRATOR      ║
╚════════════════════════════════════════════════╝${colors.reset}
`);

  // Step 1: Check if we're in a Next.js project
  log.header('Step 1: Verifying Next.js project...');
  const packageJsonPath = path.join(config.targetDir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    log.error('No package.json found. Please run from within barron-agency folder in a Next.js project.');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (!packageJson.dependencies?.next) {
    log.error('This doesn\'t appear to be a Next.js project.');
    process.exit(1);
  }

  log.success('Next.js project detected');

  // Step 2: Create necessary directories
  log.header('Step 2: Creating directories...');
  Object.entries(config.folders).forEach(([key, folder]) => {
    const targetPath = path.join(config.targetDir, folder);
    if (ensureDir(targetPath)) {
      log.success(`Created ${folder}`);
    } else {
      log.info(`${folder} already exists`);
    }
  });

  // Step 3: Copy files
  log.header('Step 3: Copying agency foundation files...');

  // Components
  const componentsSource = path.join(config.sourceDir, 'components');
  const componentsTarget = path.join(config.targetDir, config.folders.components);
  copyRecursive(componentsSource, componentsTarget);
  log.success(`Copied ${fs.readdirSync(componentsSource).length} components`);

  // Icons
  const iconsSource = path.join(config.sourceDir, 'icons');
  const iconsTarget = path.join(config.targetDir, config.folders.icons);
  copyRecursive(iconsSource, iconsTarget);
  log.success(`Copied ${fs.readdirSync(iconsSource).length} icons`);

  // Styles
  const stylesSource = path.join(config.sourceDir, 'styles');
  const stylesTarget = path.join(config.targetDir, config.folders.styles);
  copyRecursive(stylesSource, stylesTarget);
  log.success('Copied styles and themes');

  // Hooks
  const hooksSource = path.join(config.sourceDir, 'hooks');
  const hooksTarget = path.join(config.targetDir, config.folders.hooks);
  copyRecursive(hooksSource, hooksTarget);
  log.success('Copied React Query hooks');

  // Utils
  const utilsSource = path.join(config.sourceDir, 'utils');
  const utilsTarget = path.join(config.targetDir, config.folders.utils);
  fs.readdirSync(utilsSource).forEach(file => {
    fs.copyFileSync(
      path.join(utilsSource, file),
      path.join(utilsTarget, file)
    );
  });
  log.success('Copied utility files');

  // Types
  const typesSource = path.join(config.sourceDir, 'types');
  const typesTarget = path.join(config.targetDir, config.folders.types);
  copyRecursive(typesSource, typesTarget);
  log.success('Copied type definitions');

  // Config
  const configSource = path.join(config.sourceDir, 'config');
  const configTarget = path.join(config.targetDir, config.folders.config);
  copyRecursive(configSource, configTarget);
  log.success('Copied configuration files');

  // Providers
  const providersSource = path.join(config.sourceDir, 'providers/providers.tsx');
  const providersTarget = path.join(config.targetDir, 'app/providers.tsx');
  fs.copyFileSync(providersSource, providersTarget);
  log.success('Copied providers');

  // Demo template
  const demoSource = path.join(config.sourceDir, 'templates/demo');
  const demoTarget = path.join(config.targetDir, 'app/demo');
  copyRecursive(demoSource, demoTarget);
  log.success('Copied demo template');

  // Step 4: Update configuration files
  log.header('Step 4: Updating configuration...');
  updateLayoutFile();
  updateGlobalStyles();

  // Step 5: Create manifest
  log.header('Step 5: Creating manifest...');
  const manifest = createManifest();
  log.success('Created barron-agency.manifest.json');

  // Summary
  console.log(`
${colors.bright}╔════════════════════════════════════════════════╗
║   ✅ INTEGRATION COMPLETE!                     ║
╚════════════════════════════════════════════════╝${colors.reset}

${colors.green}Successfully integrated:${colors.reset}
  • ${manifest.components.total} UI Components
  • ${manifest.icons.total} Icon Components
  • ${manifest.hooks.length} React Query Hooks
  • ${manifest.themes.length} Theme Variations
  • Demo page at /demo

${colors.yellow}Next Steps:${colors.reset}
  1. Install dependencies: ${colors.bright}pnpm install${colors.reset}
  2. Start dev server: ${colors.bright}pnpm dev${colors.reset}
  3. Visit demo: ${colors.bright}http://localhost:3000/demo${colors.reset}

${colors.blue}Documentation available in:${colors.reset}
  • barron-agency/docs/
  • barron-agency/CLAUDE.md

${colors.bright}🎉 Barron Agency Foundation is ready!${colors.reset}
`);
}

// Run integration
integrate().catch(error => {
  log.error(`Integration failed: ${error.message}`);
  process.exit(1);
});