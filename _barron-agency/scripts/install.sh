#!/bin/bash

# Barron Agency Foundation - Dependency Installer
# This script installs all required dependencies for the agency foundation

echo "🚀 Barron Agency Foundation - Dependency Installer"
echo "=================================================="
echo ""

# Check if we're in a Node project
if [ ! -f "../package.json" ]; then
    echo "❌ Error: No package.json found in parent directory"
    echo "   Please run this script from within the barron-agency folder"
    exit 1
fi

# Detect package manager
if [ -f "../pnpm-lock.yaml" ]; then
    PKG_MANAGER="pnpm"
elif [ -f "../yarn.lock" ]; then
    PKG_MANAGER="yarn"
elif [ -f "../package-lock.json" ]; then
    PKG_MANAGER="npm"
else
    # Default to pnpm if no lock file exists
    PKG_MANAGER="pnpm"
    echo "📦 No lock file detected, defaulting to pnpm"
fi

echo "📦 Using package manager: $PKG_MANAGER"
echo ""

# Install dependencies
echo "📥 Installing required dependencies..."
cd ..

# Core dependencies
$PKG_MANAGER add @tanstack/react-query clsx tailwind-merge

# Optional dependencies (for full functionality)
read -p "Install optional dependencies (framer-motion, react-dropzone)? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    $PKG_MANAGER add framer-motion react-dropzone
fi

# Dev dependencies if needed
if [ ! -d "node_modules/typescript" ]; then
    echo "📥 Installing TypeScript..."
    $PKG_MANAGER add -D typescript @types/react @types/react-dom @types/node
fi

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Run 'node barron-agency/scripts/integrate.js' to integrate components"
echo "2. Start your dev server"
echo ""
echo "🎉 Barron Agency Foundation ready!"