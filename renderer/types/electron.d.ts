// types/electron.d.ts - Type declarations for Electron API
export interface ElectronAPI {
  // Config operations
  getConfig: () => Promise<any>;
  saveConfig: (config: any) => Promise<{ success: boolean; error?: string }>;
  exitConfig: () => Promise<void>;

  // File operations for logo management
  selectLogoFiles: () => Promise<string[]>;

  // App control
  minimize: () => Promise<void>;
  close: () => Promise<void>;

  // Event listeners for config updates
  onConfigUpdated: (callback: (event: any, config: any) => void) => void;
  removeConfigListener: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
