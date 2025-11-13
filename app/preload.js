/**
 * Preload script for Electron
 * 
 * This script runs in a privileged context with access to Node.js APIs
 * while the renderer process runs in a sandboxed environment.
 * 
 * It exposes only safe, specific APIs to the renderer process through
 * the contextBridge, following Electron security best practices.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App version and info
  getAppVersion: () => process.versions.electron,
  
  // Platform information
  getPlatform: () => process.platform,
  
  // Node process information
  getNodeVersion: () => process.versions.node,
  
  // Chrome version
  getChromeVersion: () => process.versions.chrome,
  
  // Check if running in Electron
  isElectron: true
});

// Log that preload script has loaded
console.log('Preload script loaded successfully');
