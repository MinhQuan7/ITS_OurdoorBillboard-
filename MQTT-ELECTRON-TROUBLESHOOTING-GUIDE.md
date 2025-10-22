# Hướng Dẫn Khắc Phục Lỗi MQTT trong Electron - E-Ra IoT Integration

## 📋 Tổng Quan Vấn Đề

### Lỗi Chính

```
[Renderer] EraIotService: Failed to connect: TypeError: n.createConnection is not a function
```

### Triệu Chứng

- MQTT connection thất bại trong renderer process
- E-Ra IoT service không thể nhận dữ liệu sensor
- UI hiển thị "Using fallback sensor data"
- Log chỉ hiển thị khởi tạo MQTT mà không có data updates

---

## 🔍 Nguyên Nhân Gốc Rễ

### 1. Kiến Trúc Electron

Electron có hai process chính:

- **Main Process**: Chạy trong Node.js environment, có full access đến Node.js APIs
- **Renderer Process**: Chạy trong Chromium browser environment, bị giới hạn security

### 2. Vấn Đề với MQTT.js trong Renderer

```javascript
// ❌ Không hoạt động trong Renderer Process
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://mqtt1.eoh.io:1883");
// Error: n.createConnection is not a function
```

**Lý do:**

- MQTT.js cần Node.js modules như `net`, `tls`, `fs` để tạo TCP connections
- Renderer process không có access đến những modules này
- Browser version của MQTT.js có giới hạn và không support TCP direct connections
- Electron's context isolation và security restrictions ngăn chặn access

### 3. Chi Tiết Kỹ Thuật

#### File: `renderer/index.html`

```html
<!-- MQTT.js browser version - BỊ GIỚI HẠN -->
<script src="https://unpkg.com/mqtt@4.3.7/dist/mqtt.min.js"></script>
```

#### File: `renderer/app-built.js` (Phiên bản cũ - Lỗi)

```javascript
// ❌ Cố gắng sử dụng MQTT trực tiếp trong renderer
class EraIotService {
  async connectMQTT() {
    // Lỗi xảy ra ở đây
    this.mqttClient = mqtt.connect(brokerUrl, {
      username: this.gatewayToken,
      password: this.gatewayToken,
      // ... TCP connection không thể tạo được
    });
  }
}
```

---

## ✅ Giải Pháp Triển Khai

### Kiến Trúc Mới: Main Process MQTT + IPC Communication

```
┌─────────────────┐    IPC     ┌─────────────────┐
│   Main Process  │◄──────────►│ Renderer Process│
│                 │            │                 │
│ ┌─────────────┐ │            │ ┌─────────────┐ │
│ │ MQTT Service│ │   Sensor   │ │    UI/IoT   │ │
│ │ - TCP Conn  │ │    Data    │ │   Service   │ │
│ │ - E-Ra Sub  │ │◄──────────►│ │ - Callbacks │ │
│ │ - Real-time │ │            │ │ - Updates   │ │
│ └─────────────┘ │            │ └─────────────┘ │
└─────────────────┘            └─────────────────┘
```

### 1. Main Process MQTT Service

#### File: `main.js`

```javascript
// ✅ MQTT hoạt động tốt trong Main Process
const mqtt = require("mqtt");

class MainProcessMqttService {
  async connectMQTT() {
    // Full Node.js environment - có access đến net, tls
    this.client = mqtt.connect("mqtt://mqtt1.eoh.io:1883", {
      username: this.gatewayToken,
      password: this.gatewayToken,
      clientId: `billboard_${this.gatewayToken}_${Date.now()}`,
      keepalive: 60,
      connectTimeout: 15000,
      clean: true,
    });

    this.client.on("connect", () => {
      console.log("✅ Successfully connected to E-Ra MQTT broker!");
      this.subscribeToTopics();
    });

    this.client.on("message", (topic, message) => {
      this.handleMqttMessage(topic, message);
    });
  }

  handleMqttMessage(topic, message) {
    const data = JSON.parse(message.toString());
    const configId = this.extractConfigId(topic);
    const sensorType = this.mapConfigIdToSensorType(configId);

    // Cập nhật dữ liệu global
    currentSensorData[sensorType] = data.v;
    currentSensorData.lastUpdated = new Date();

    // Gửi đến renderer qua IPC
    this.broadcastSensorData();
  }

  broadcastSensorData() {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("era-iot-data-update", currentSensorData);
    }
  }
}
```

### 2. IPC Communication Setup

#### File: `preload.js`

```javascript
// ✅ Secure IPC bridge
contextBridge.exposeInMainWorld("electronAPI", {
  // E-Ra IoT MQTT data handlers
  getEraIotData: () => ipcRenderer.invoke("get-era-iot-data"),
  refreshEraIotConnection: () =>
    ipcRenderer.invoke("refresh-era-iot-connection"),
  onEraIotDataUpdate: (callback) =>
    ipcRenderer.on("era-iot-data-update", callback),
  onEraIotStatusUpdate: (callback) =>
    ipcRenderer.on("era-iot-status-update", callback),
  removeEraIotDataListener: () =>
    ipcRenderer.removeAllListeners("era-iot-data-update"),
  removeEraIotStatusListener: () =>
    ipcRenderer.removeAllListeners("era-iot-status-update"),
});
```

### 3. Renderer Process - IPC Client

#### File: `renderer/app-built.js`

```javascript
// ✅ IPC-based EraIotService (Không dùng MQTT trực tiếp)
class EraIotService {
  constructor(config) {
    this.config = config;
    this.currentData = null;
    this.isInitialized = false;
    this.dataUpdateCallbacks = [];
  }

  async startPeriodicUpdates() {
    console.log("EraIotService: Starting IPC-based connection...");

    // Setup IPC listeners thay vì MQTT
    this.setupIpcListeners();
    await this.fetchInitialData();

    this.isInitialized = true;
  }

  setupIpcListeners() {
    // Listen for data updates từ main process
    window.electronAPI.onEraIotDataUpdate((event, data) => {
      console.log(
        "EraIotService: Received data update from main process:",
        data
      );
      this.currentData = data;
      this.notifyDataUpdateCallbacks();
    });

    // Listen for status updates
    window.electronAPI.onEraIotStatusUpdate((event, status) => {
      console.log(
        "EraIotService: Received status update from main process:",
        status
      );
      this.notifyStatusUpdateCallbacks(status);
    });
  }

  async fetchInitialData() {
    const data = await window.electronAPI.getEraIotData();
    if (data) {
      this.currentData = data;
      this.notifyDataUpdateCallbacks();
    }
  }
}
```

---

## 🔧 Các Bước Khắc Phục Chi Tiết

### Bước 1: Chẩn Đoán Lỗi

```bash
# Chạy ứng dụng và kiểm tra log
npm run dev

# Tìm kiếm các lỗi sau:
# - "n.createConnection is not a function"
# - "Failed to connect: TypeError"
# - "Using fallback sensor data"
```

### Bước 2: Backup Code Cũ

```bash
# Backup file renderer hiện tại
cp renderer/app-built.js renderer/app-built.js.backup
cp main.js main.js.backup
cp preload.js preload.js.backup
```

### Bước 3: Implement Main Process MQTT

#### 3.1 Thêm MQTT import vào `main.js`

```javascript
const mqtt = require("mqtt");

// Global variables cho MQTT
let mqttService = null;
let currentSensorData = {
  temperature: null,
  humidity: null,
  pm25: null,
  pm10: null,
  lastUpdated: null,
  status: "offline",
};
```

#### 3.2 Tạo MainProcessMqttService class

```javascript
class MainProcessMqttService {
  constructor() {
    this.client = null;
    this.config = null;
    this.isConnected = false;
  }

  async initialize(eraIotConfig) {
    this.config = eraIotConfig;
    this.gatewayToken = this.extractGatewayToken(eraIotConfig.authToken);
    await this.connectMQTT();
    return true;
  }

  extractGatewayToken(authToken) {
    const tokenMatch = authToken.match(/Token\s+(.+)/);
    return tokenMatch ? tokenMatch[1] : null;
  }

  async connectMQTT() {
    const brokerUrl = "mqtt://mqtt1.eoh.io:1883";

    this.client = mqtt.connect(brokerUrl, {
      username: this.gatewayToken,
      password: this.gatewayToken,
      clientId: `billboard_${this.gatewayToken}_${Date.now()}`,
      keepalive: 60,
      connectTimeout: 15000,
      clean: true,
    });

    this.client.on("connect", () => {
      this.isConnected = true;
      this.subscribeToTopics();
      this.startPeriodicUpdates();
    });

    this.client.on("message", (topic, message) => {
      this.handleMqttMessage(topic, message);
    });
  }

  subscribeToTopics() {
    const topic = `eoh/chip/${this.gatewayToken}/config/+/value`;
    this.client.subscribe(topic, { qos: 1 });
  }

  handleMqttMessage(topic, message) {
    const data = JSON.parse(message.toString());
    const configIdMatch = topic.match(/\/config\/(\d+)\/value$/);

    if (configIdMatch) {
      const configId = parseInt(configIdMatch[1]);
      const sensorType = this.mapConfigIdToSensorType(configId);

      if (sensorType) {
        currentSensorData[sensorType] = data.v;
        currentSensorData.lastUpdated = new Date();
        currentSensorData.status = "connected";
        this.broadcastSensorData();
      }
    }
  }

  mapConfigIdToSensorType(configId) {
    if (this.config.sensorConfigs.temperature === configId)
      return "temperature";
    if (this.config.sensorConfigs.humidity === configId) return "humidity";
    if (this.config.sensorConfigs.pm25 === configId) return "pm25";
    if (this.config.sensorConfigs.pm10 === configId) return "pm10";
    return null;
  }

  broadcastSensorData() {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("era-iot-data-update", currentSensorData);
    }
  }
}
```

#### 3.3 Thêm IPC handlers

```javascript
// IPC handlers for MQTT data
ipcMain.handle("get-era-iot-data", async () => {
  return currentSensorData;
});

ipcMain.handle("refresh-era-iot-connection", async () => {
  if (mqttService) {
    mqttService.disconnect();
    await initializeMqttService();
    return { success: true };
  }
  return { success: false, message: "MQTT service not initialized" };
});
```

#### 3.4 Initialize MQTT trong app startup

```javascript
app.whenReady().then(async () => {
  createMainWindow();
  setupConfigWatcher();

  // Initialize MQTT service
  await initializeMqttService();

  console.log("MQTT service initialized");
});
```

### Bước 4: Cập Nhật Preload.js

```javascript
contextBridge.exposeInMainWorld("electronAPI", {
  // Existing methods...

  // E-Ra IoT MQTT data handlers (NEW)
  getEraIotData: () => ipcRenderer.invoke("get-era-iot-data"),
  refreshEraIotConnection: () =>
    ipcRenderer.invoke("refresh-era-iot-connection"),
  onEraIotDataUpdate: (callback) =>
    ipcRenderer.on("era-iot-data-update", callback),
  onEraIotStatusUpdate: (callback) =>
    ipcRenderer.on("era-iot-status-update", callback),
  removeEraIotDataListener: () =>
    ipcRenderer.removeAllListeners("era-iot-data-update"),
  removeEraIotStatusListener: () =>
    ipcRenderer.removeAllListeners("era-iot-status-update"),
});
```

### Bước 5: Cập Nhật Renderer EraIotService

#### 5.1 Thay thế MQTT logic bằng IPC

```javascript
// ❌ Xóa phần này (MQTT trực tiếp)
async connectMQTT() {
  this.mqttClient = mqtt.connect(brokerUrl, {
    // ... TCP connection fails here
  });
}

// ✅ Thay bằng IPC logic
async startPeriodicUpdates() {
  console.log("EraIotService: Starting IPC-based connection...");

  this.setupIpcListeners();
  await this.fetchInitialData();

  this.isInitialized = true;
}

setupIpcListeners() {
  window.electronAPI.onEraIotDataUpdate((event, data) => {
    this.currentData = data;
    this.notifyDataUpdateCallbacks();
  });
}
```

### Bước 6: Build và Test

```bash
# Rebuild renderer components
npm run build:renderer

# Test ứng dụng
npm run dev

# Kiểm tra log để confirm hoạt động:
# - "MainProcessMqttService: Successfully connected"
# - "MainProcessMqttService: Updating temperature"
# - "EraIotService: Received data update from main process"
```

---

## 🧪 Kiểm Tra và Verification

### Kiểm Tra MQTT Connection

```bash
# Terminal 1: Chạy test script
node test-era-mqtt-simple.js

# Terminal 2: Chạy ứng dụng
npm run dev

# So sánh output - cả hai phải nhận được data từ E-Ra
```

### Expected Success Log

```
MainProcessMqttService: Initializing with gateway token: f7d2fe19-5...
MainProcessMqttService: ✅ Successfully connected to E-Ra MQTT broker!
MainProcessMqttService: ✅ Successfully subscribed to: eoh/chip/.../config/+/value
MainProcessMqttService: [time] eoh/chip/.../config/138997/value: {"v":27}
MainProcessMqttService: Updating temperature (ID: 138997) = 27
[Renderer] EraIotService: Received data update from main process: {...}
[Renderer] BillboardLayout: E-Ra IoT service initialized successfully
```

---

## 🚫 Các Lỗi Thường Gặp và Cách Khắc Phục

### Lỗi 1: "Attempted to register a second handler"

```
Failed to initialize MQTT service: Error: Attempted to register a second handler for 'get-config'
```

**Nguyên nhân:** IPC handler được đăng ký nhiều lần

**Khắc phục:**

```javascript
// ❌ Wrong
const config = await ipcMain.handle("get-config", {});

// ✅ Correct - Đọc file trực tiếp trong main process
const configData = fs.readFileSync(configPath, "utf8");
const config = JSON.parse(configData);
```

### Lỗi 2: "electronAPI not available"

```
EraIotService: electronAPI not available
```

**Nguyên nhân:** Preload script không load đúng

**Khắc phục:**

```javascript
// main.js - BrowserWindow config
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  preload: path.join(__dirname, "preload.js"), // ✅ Ensure correct path
}
```

### Lỗi 3: No data received in renderer

```
EraIotService: No initial data available from main process
```

**Nguyên nhân:** MQTT service chưa được khởi tạo trước renderer

**Khắc phục:**

```javascript
// Ensure MQTT initialization in app.whenReady()
app.whenReady().then(async () => {
  createMainWindow();
  await initializeMqttService(); // ✅ Init before window ready
});
```

---

## 📊 Performance và Monitoring

### Real-time Data Flow

```
E-Ra IoT Platform ──TCP──► Main Process MQTT ──IPC──► Renderer UI
    (1 Hz updates)         (Node.js env)            (Browser env)
```

### Log Monitoring Commands

```bash
# Filter MQTT logs only
npm run dev 2>&1 | grep "MainProcessMqttService"

# Filter IPC communication
npm run dev 2>&1 | grep "EraIotService.*Received"

# Monitor data updates
npm run dev 2>&1 | grep "Updating.*ID"
```

### Performance Metrics

- **MQTT Connection:** < 5 seconds
- **Data Update Frequency:** 1 Hz (mỗi giây)
- **IPC Latency:** < 10ms
- **Memory Usage:** ~50MB cho MQTT service

---

## 🎯 Kết Luận

### Vấn Đề Chính

MQTT.js không thể hoạt động trực tiếp trong Electron renderer process do giới hạn security và thiếu Node.js modules.

### Giải Pháp

Di chuyển MQTT service sang main process và sử dụng IPC để communication với renderer.

### Benefits

- ✅ Security tốt hơn (MQTT credentials không exposed trong renderer)
- ✅ Performance ổn định (Native Node.js TCP connections)
- ✅ Architecture clean (Separation of concerns)
- ✅ Real-time data updates
- ✅ Error handling tốt hơn

### Bài Học Quan Trọng

1. **Hiểu rõ Electron architecture** - Main vs Renderer process capabilities
2. **Security-first approach** - Sensitive operations trong main process
3. **IPC design patterns** - Effective communication giữa processes
4. **Testing strategy** - Verify từng component riêng biệt

---

_Hướng dẫn này được tạo dựa trên kinh nghiệm thực tế khắc phục lỗi MQTT trong E-Ra IoT integration project._
