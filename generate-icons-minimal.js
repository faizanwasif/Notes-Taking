/**
 * PWA Icon Generator using Inkscape and ImageMagick
 * Alternative version that doesn't require Node.js dependencies
 * 
 * Requirements:
 * - Inkscape (https://inkscape.org/)
 * - ImageMagick (https://imagemagick.org/)
 * 
 * Usage: node generate-icons-minimal.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_ICON = 'icon.svg';
const OUTPUT_DIR = 'assets/icons';
const FAVICON_SIZE = 32;

// Define the icon sizes needed for PWA
const PWA_ICON_SIZES = [
  72, 96, 128, 144, 152, 192, 384, 512
];

// Define additional special-purpose icons
const SPECIAL_ICONS = [
  { name: 'note-icon-96x96', size: 96 },
  { name: 'task-icon-96x96', size: 96 },
  { name: 'favicon', size: FAVICON_SIZE }
];

// Check if required tools are installed
function checkRequiredTools() {
  try {
    // Check for Inkscape
    execSync('inkscape --version', { stdio: 'ignore' });
    console.log('✅ Inkscape is installed');
  } catch (e) {
    console.error('❌ Inkscape is not installed or not in PATH');
    console.error('Please install Inkscape from https://inkscape.org/');
    process.exit(1);
  }

  try {
    // Check for ImageMagick
    execSync('convert --version', { stdio: 'ignore' });
    console.log('✅ ImageMagick is installed');
  } catch (e) {
    console.error('❌ ImageMagick is not installed or not in PATH');
    console.error('Please install ImageMagick from https://imagemagick.org/');
    process.exit(1);
  }
}

// Ensure the output directory exists
function ensureOutputDirectory() {
  console.log(`Ensuring output directory exists: ${OUTPUT_DIR}`);
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

// Generate PNG icons in all required sizes
function generatePwaIcons() {
  try {
    console.log(`Generating PWA icons from ${SOURCE_ICON}`);
    
    // Ensure source file exists
    if (!fs.existsSync(SOURCE_ICON)) {
      throw new Error(`Source file ${SOURCE_ICON} not found!`);
    }
    
    // Create output directory if it doesn't exist
    ensureOutputDirectory();
    
    // Generate standard PWA icons
    for (const size of PWA_ICON_SIZES) {
      const outputFile = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
      console.log(`Generating ${outputFile}...`);
      
      // Using Inkscape to convert SVG to PNG
      execSync(`inkscape --export-filename="${outputFile}" --export-width=${size} --export-height=${size} "${SOURCE_ICON}"`);
    }
    
    // Generate special purpose icons
    for (const icon of SPECIAL_ICONS) {
      const outputFile = path.join(OUTPUT_DIR, `${icon.name}.png`);
      console.log(`Generating ${outputFile}...`);
      
      execSync(`inkscape --export-filename="${outputFile}" --export-width=${icon.size} --export-height=${icon.size} "${SOURCE_ICON}"`);
    }
    
    // Generate favicon.ico
    console.log('Generating favicon.ico...');
    const faviconPng = path.join(OUTPUT_DIR, 'favicon.png');
    const faviconIco = path.join(OUTPUT_DIR, 'favicon.ico');
    
    // First create a PNG
    execSync(`inkscape --export-filename="${faviconPng}" --export-width=${FAVICON_SIZE} --export-height=${FAVICON_SIZE} "${SOURCE_ICON}"`);
    
    // Then convert PNG to ICO using ImageMagick
    execSync(`convert "${faviconPng}" -define icon:auto-resize=16,32,48 "${faviconIco}"`);
    
    // Remove temporary PNG
    fs.unlinkSync(faviconPng);
    
    console.log('\nIcon generation complete! ✅');
    console.log(`All icons have been saved to the ${OUTPUT_DIR} directory.`);
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

// Create a verification HTML file to check the icons
function generateVerificationFile() {
  const htmlPath = 'icon-verification.html';
  console.log(`\nGenerating verification file: ${htmlPath}`);
  
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PWA Icon Verification</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #4285f4; }
    .icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; margin-top: 20px; }
    .icon-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center; }
    .icon-card img { max-width: 100%; height: auto; margin-bottom: 10px; }
    .file-name { font-size: 14px; color: #555; }
    .size-info { font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <h1>PWA Icon Verification</h1>
  <p>Below are all the generated icons for your Progressive Web App:</p>
  
  <div class="icon-grid">
`;

  // Add standard PWA icons
  for (const size of PWA_ICON_SIZES) {
    const iconPath = `${OUTPUT_DIR}/icon-${size}x${size}.png`;
    html += `
    <div class="icon-card">
      <img src="${iconPath}" alt="Icon ${size}x${size}">
      <div class="file-name">icon-${size}x${size}.png</div>
      <div class="size-info">${size}x${size} pixels</div>
    </div>
    `;
  }

  // Add special icons
  for (const icon of SPECIAL_ICONS) {
    if (icon.name === 'favicon') continue; // Skip favicon as it's ICO not PNG
    
    const iconPath = `${OUTPUT_DIR}/${icon.name}.png`;
    html += `
    <div class="icon-card">
      <img src="${iconPath}" alt="${icon.name}">
      <div class="file-name">${icon.name}.png</div>
      <div class="size-info">${icon.size}x${icon.size} pixels</div>
    </div>
    `;
  }
  
  // Add favicon
  html += `
  <div class="icon-card">
    <img src="${OUTPUT_DIR}/favicon.ico" alt="favicon">
    <div class="file-name">favicon.ico</div>
    <div class="size-info">Multi-size ICO file</div>
  </div>
  `;

  html += `
  </div>
  
  <h2 style="margin-top: 30px;">Next Steps</h2>
  <ol>
    <li>Make sure all icons are displayed correctly above</li>
    <li>Verify that your manifest.json references these icon files</li>
    <li>Test your PWA installation on various devices</li>
  </ol>
</body>
</html>
  `;

  fs.writeFileSync(htmlPath, html);
  console.log(`Verification file created! Open ${htmlPath} in a browser to check your icons.`);
}

function run() {
  console.log('=== PWA Icon Generator (Minimal Version) ===');
  checkRequiredTools();
  generatePwaIcons();
  generateVerificationFile();
  console.log('\nAll done! Your PWA icons are ready to use. 🚀');
}

// Start the process
run();