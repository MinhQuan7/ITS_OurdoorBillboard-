// main.js - Electron Main Process
// Quản lý cửa sổ chính và lifecycle của ứng dụng

const { app, BrowserWindow } = require('electron');
const path = require('path');

// Biến global để lưu reference của cửa sổ chính
let mainWindow;

/**
 * Tạo cửa sổ chính của ứng dụng
 * Kích thước cố định: 384x384 pixels (tương ứng với màn hình LED)
 */
function createWindow() {
  // Tạo cửa sổ với cấu hình cho màn hình LED outdoor
  mainWindow = new BrowserWindow({
    width: 384,           // Chiều rộng cố định
    height: 384,          // Chiều cao cố định  
    frame: false,         // Không viền window (fullscreen appearance)
    resizable: false,     // Không cho phép thay đổi kích thước
    alwaysOnTop: true,    // Luôn hiển thị trên cùng
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png') // Icon ứng dụng (tùy chọn)
  });

  // Load file HTML chính
  mainWindow.loadFile('renderer/index.html');

  // Bật DevTools cho development (có thể tắt ở production)
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Xử lý khi cửa sổ bị đóng
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Khởi chạy ứng dụng khi Electron sẵn sàng
app.whenReady().then(createWindow);

// Thoát ứng dụng khi tất cả cửa sổ đóng (trừ macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Tạo lại cửa sổ khi click vào dock (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});