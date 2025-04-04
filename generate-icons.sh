#!/bin/bash

echo "=== PWA Icon Generator for Mac/Linux ==="
echo "This script will install necessary packages and generate icons"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed."
  echo "Please install Node.js from https://nodejs.org/"
  echo "or use your package manager (apt, brew, etc.)"
  exit 1
fi

# Install required packages
echo "Installing required packages..."
npm install --no-fund sharp fs-extra

# Run the generator script
echo ""
echo "Running icon generator..."
node generate-icons.js

echo ""
echo "If all went well, your icons are now in the assets/icons directory."
echo "To verify them, open icon-verification.html in your browser."
echo ""