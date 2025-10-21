# 🖼️ Billboard Banner Management System

## Tổng quan

Hệ thống quản lý banner cho billboard từ xa sử dụng E-Ra IoT Platform, cho phép cập nhật banner quảng cáo mà không cần truy cập trực tiếp mini PC.

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐    E-Ra API     ┌─────────────────┐    E-Ra MQTT    ┌─────────────────┐
│   Web Admin     │ ──────────────→ │   E-Ra Cloud    │ ──────────────→ │  Desktop App    │
│ (HTML/CSS/JS)   │   Upload Image  │   IoT Platform  │   Banner Data   │   (Electron)    │
│                 │                 │                 │                 │                 │
└─────────────────┘                 └─────────────────┘                 └─────────────────┘
```

## 📁 Cấu trúc file

```
📦 Billboard Banner System
├── 🌐 web-admin/                 # Web interface cho admin
│   ├── index.html               # Main page với glass effect
│   ├── style.css               # Glass morphism styling
│   ├── script.js               # Upload logic + UI handling
│   └── era-config.js           # E-Ra platform integration
│
├── 🖥️ renderer/services/        # Desktop app services
│   └── bannerService.ts        # Banner management service
│
└── 🖥️ renderer/components/      # React components
    ├── BannerDisplay.tsx       # Banner display component
    └── BannerDisplay.css       # Component styling
```

## 🚀 Setup hướng dẫn

### 1. Cấu hình E-Ra Platform

#### A. Tạo Variables trên E-Ra Platform:

Truy cập E-Ra dashboard và tạo các variables sau:

```javascript
// Variables cần tạo:
banner_data; // String - Chứa Base64 encoded image
banner_filename; // String - Tên file ảnh
banner_timestamp; // Number - Timestamp upload
banner_status; // String - Status: "uploaded", "active", "error"
```

#### B. Lấy thông tin xác thực:

- **AUTH_TOKEN**: Token từ E-Ra dashboard
- **DEVICE_ID**: ID của device/gateway
- **MQTT_API_KEY**: API key cho MQTT (nếu cần)

### 2. Cấu hình Web Admin

Chỉnh sửa `web-admin/era-config.js`:

```javascript
const ERA_CONFIG = {
  // Thay đổi thông tin này theo E-Ra của bạn
  AUTH_TOKEN: "Token your-real-auth-token-here",
  DEVICE_ID: "your-device-id-here",
  API_BASE_URL: "https://backend.eoh.io/api/v1",
  MQTT_BROKER: "mqtt://backend.eoh.io:1883",

  VARIABLES: {
    BANNER_DATA: "banner_data",
    BANNER_FILENAME: "banner_filename",
    BANNER_TIMESTAMP: "banner_timestamp",
    BANNER_STATUS: "banner_status",
  },
};
```

### 3. Cấu hình Desktop App

Thêm banner config vào file cấu hình chính:

```typescript
// Trong config service của desktop app
const bannerConfig: BannerConfig = {
  enabled: true,
  authToken: "Token your-real-auth-token-here",
  baseUrl: "https://backend.eoh.io",
  mqttApiKey: "your-mqtt-api-key",
  variables: {
    bannerData: "banner_data",
    bannerFilename: "banner_filename",
    bannerTimestamp: "banner_timestamp",
    bannerStatus: "banner_status",
  },
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 5000,
};
```

### 4. Tích hợp vào Billboard Layout

Thêm BannerDisplay component vào layout hiện tại:

```tsx
import BannerDisplay from "./components/BannerDisplay";

// Trong component chính
<BannerDisplay
  config={bannerConfig}
  className="billboard-banner"
  fallbackImage="/assets/imgs/default-banner.jpg"
  showStatus={true}
/>;
```

## 💡 Cách sử dụng

### Upload Banner (Web Admin):

1. **Truy cập web admin**: Mở `web-admin/index.html` trong trình duyệt
2. **Drag & Drop**: Kéo thả ảnh banner vào vùng upload
3. **Preview**: Xem trước ảnh trước khi upload
4. **Upload**: Click "Upload Banner" để gửi lên E-Ra platform
5. **Theo dõi**: Xem status update real-time

### Hiển thị Banner (Desktop App):

1. **Auto-sync**: Desktop app tự động nhận banner mới qua MQTT
2. **Real-time update**: Banner được cập nhật ngay lập tức
3. **Fallback**: Hiển thị ảnh mặc định nếu không có banner
4. **Status tracking**: Theo dõi trạng thái kết nối và update

## 🔧 Features

### Web Admin:

- ✅ Glass morphism UI design
- ✅ Drag & drop upload
- ✅ Real-time preview
- ✅ Upload progress tracking
- ✅ Connection status monitoring
- ✅ Upload history
- ✅ File validation (type, size)

### Desktop App:

- ✅ Real-time banner sync via MQTT
- ✅ Base64 image processing
- ✅ Fallback image support
- ✅ Status indicators
- ✅ Auto-reconnection
- ✅ Error handling

## 🔒 Bảo mật

- **File validation**: Chỉ cho phép file ảnh (JPEG, PNG, GIF, WebP)
- **Size limits**: Giới hạn 5MB per file
- **Authentication**: E-Ra token-based auth
- **Base64 encoding**: Secure data transmission
- **Error handling**: Graceful error recovery

## 🐛 Troubleshooting

### Lỗi thường gặp:

1. **"Invalid AUTHTOKEN"**

   - Kiểm tra AUTH_TOKEN trong config
   - Đảm bảo format: `Token your-actual-token`

2. **"MQTT connection failed"**

   - Kiểm tra MQTT_API_KEY
   - Verify broker URL và port

3. **"Banner not updating"**

   - Check E-Ra variables đã được tạo
   - Verify variable names match config

4. **"Image not displaying"**
   - Kiểm tra Base64 encoding
   - Verify image format support

### Debug steps:

```javascript
// Test E-Ra API connection
const test = await eraAPI.testConnection();
console.log(test);

// Test banner service
const bannerService = new BannerService(config);
const testResult = await bannerService.testConnection();
console.log(testResult);
```

## 📊 Monitoring

### Web Admin logs:

- Connection status
- Upload progress
- API responses
- Error messages

### Desktop App logs:

- MQTT connection status
- Banner update events
- Image processing results
- Service health checks

## 🔄 Flow xử lý chi tiết

### Upload Flow:

1. User chọn ảnh → File validation
2. Convert to Base64 → Preview display
3. Upload to E-Ra API → Update variables
4. E-Ra MQTT broadcast → Desktop receives
5. Desktop processes → Banner display update
6. Status confirmation → UI update

### Error Recovery:

- Auto-retry on connection failure
- Fallback to default image
- MQTT reconnection logic
- User notification system

## 🎯 Performance

- **File size**: Tối ưu với Base64 encoding
- **Real-time sync**: MQTT low latency
- **Bandwidth**: Efficient chunking cho large files
- **Memory**: Proper cleanup và URL management

## 🚧 Mở rộng tương lai

- [ ] Multiple banner slots
- [ ] Scheduling system
- [ ] Banner templates
- [ ] Analytics tracking
- [ ] Multi-device management
- [ ] Video banner support
