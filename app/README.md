# TARA Fusion Electron App

This directory contains the Electron desktop application for TARA Fusion.

## Overview

The Electron app packages the TARA Fusion web application as a native desktop application for macOS, Linux, and Windows.

## Architecture

- **main.js**: Main Electron process - creates and manages application windows
- **preload.js**: Preload script that bridges the main and renderer processes securely
- **build/**: Build resources including icons and entitlements
- **dist/**: Output directory for built application packages (created during build)

## Building the App

### Prerequisites

- Node.js 18 or higher
- npm

### Install Dependencies

```bash
npm install
```

### Build for Current Platform

```bash
npm run build
```

### Build for Specific Platforms

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux

# All platforms
npm run build:all
```

### Build Output

Built applications will be in the `dist/` directory:

- **macOS**: `.dmg` and `.zip` files for Intel (x64), Apple Silicon (arm64), and Universal builds
- **Windows**: `.exe` installer and `.zip` files for x64 and ARM64
- **Linux**: `.AppImage`, `.deb`, `.rpm`, and `.tar.gz` packages for x64 and ARM64

## Supported Architectures

- **x64**: Intel/AMD 64-bit
- **arm64**: ARM 64-bit (Apple Silicon, ARM Windows, ARM Linux)
- **universal** (macOS only): Combined x64 + arm64 binary

## Development

To run the app in development mode:

```bash
# First, build the web app
cd ../src
npm install
npm run build

# Then run the Electron app
cd ../app
npm start
```

## Security

The Electron app follows security best practices:

- **Context Isolation**: Enabled to prevent prototype pollution attacks
- **Sandbox**: Enabled for renderer processes
- **Node Integration**: Disabled in renderer processes
- **Web Security**: Enabled
- **Preload Script**: Uses contextBridge to safely expose APIs

## Configuration

The app configuration is in `package.json` under the `build` key. This includes:

- App ID and product name
- Platform-specific settings
- Code signing configuration (for production)
- Icon paths
- Build targets and architectures

## Icons

Place your application icons in the `build/` directory:

- `icon.icns` - macOS icon (512x512 or 1024x1024)
- `icon.ico` - Windows icon (256x256)
- `icon.png` - Linux icon (512x512 or 1024x1024)

## Automated Builds

The GitHub Actions workflow `.github/workflows/electron-app.yml` handles automated building and releasing of the Electron app with SLSA Level 3 provenance.

## License

MIT - See the root LICENSE file for details.
