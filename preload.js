// preload.js - IPC Bridge for secure communication
const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Config operations
  getConfig: () => ipcRenderer.invoke("get-config"),
  saveConfig: (config) => ipcRenderer.invoke("save-config", config),
  exitConfig: () => ipcRenderer.invoke("exit-config"),

  // File operations for logo management
  selectLogoFiles: () => ipcRenderer.invoke("select-logo-files"),

  // App control
  minimize: () => ipcRenderer.invoke("minimize-app"),
  close: () => ipcRenderer.invoke("close-app"),

  // Event listeners for config updates
  onConfigUpdated: (callback) => ipcRenderer.on("config-updated", callback),
  removeConfigListener: () => ipcRenderer.removeAllListeners("config-updated"),

  // Force service refresh handler for hot-reload
  onForceRefreshServices: (callback) =>
    ipcRenderer.on("force-refresh-services", callback),
  removeForceRefreshListener: () =>
    ipcRenderer.removeAllListeners("force-refresh-services"),

  // E-Ra IoT specific handlers
  updateEraIotConfig: (config) =>
    ipcRenderer.invoke("update-era-iot-config", config),
  onEraIotConfigUpdated: (callback) =>
    ipcRenderer.on("era-iot-config-updated", callback),

  // Authentication handlers
  updateAuthToken: (token) => ipcRenderer.invoke("update-auth-token", token),
  onAuthTokenUpdated: (callback) =>
    ipcRenderer.on("auth-token-updated", callback),
});
