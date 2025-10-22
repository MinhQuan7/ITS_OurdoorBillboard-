# ITS Outdoor Billboard Display System

## 📋 Tổng quan dự án

**ITS Outdoor Billboard** là hệ thống hiển thị billboard ngoài trời thông minh được phát triển bằng Electron + React, tích hợp real-time weather API và IoT sensor data.

### ✨ Tính năng chính

- 📊 **IoT Sensor Integration**: Real-time MQTT data từ E-RA IoT Platform
- 🌤️ **Real-time Weather Display**: Hiển thị thời tiết real-time từ OpenMeteo API
- 🏢 **Company Logo Management**: Hỗ trợ logo rotation và scheduling
- 🔧 **Configuration System**: Giao diện config dễ sử dụng (F1 key)
- 📱 **Responsive Design**: Tối ưu cho màn hình 384x384px

## 🏗️ Kiến trúc hệ thống

```
├── main.js                 # Electron main process
├── preload.js             # Electron preload script
├── build-renderer.js      # Build system cho React components
├── renderer/
│   ├── index.html         # Main HTML file
│   ├── app-built.js       # Generated React bundle
│   ├── components/        # React components
│   ├── services/          # Business logic services
│   └── assets/           # Static assets
├── docs/                 # Documentation
└── tests/               # Test files
```

## 🚀 Cài đặt và chạy

### Prerequisites

- Node.js >= 16
- npm >= 7

### Installation

```bash
# Clone repository
git clone https://github.com/MinhQuan7/ITS_OurdoorBillboard-.git
cd ITS_OurdoorScreen

# Install dependencies
npm install

# Build renderer components
npm run build:renderer

# Run development mode
npm run dev

# Run production mode
npm start
```

### Available Scripts

```bash
npm run dev              # Development mode với auto-rebuild
npm run build:renderer   # Build React components
npm run electron        # Run Electron app
npm start               # Production mode
npm run kill            # Kill all electron processes
```

## 🔧 System Components

### 1. WeatherService

**Location**: `renderer/services/weatherService.ts`

Quản lý real-time weather data từ OpenMeteo API:

- Auto-refresh mỗi 15 phút
- Retry logic với exponential backoff
- Fallback data khi API không khả dụng
- Vietnamese weather condition translations

```javascript
const weatherService = new WeatherService({
  location: {
    lat: 16.4637,
    lon: 107.5909,
    city: "TP. THỪA THIÊN HUẾ",
  },
  updateInterval: 15,
  retryInterval: 5,
  maxRetries: 3,
});
```

### 2. GlobalWeatherServiceManager

**Location**: `build-renderer.js` (template)

Singleton pattern để quản lý global weather service:

- Đảm bảo single instance across components
- Publisher-subscriber pattern cho real-time updates
- Automatic notification system

### 3. WeatherPanel Component

**Location**: `renderer/components/WeatherPanel.tsx`

React component hiển thị weather information:

- Real-time temperature, humidity, wind speed
- Weather condition với icon
- Air quality indicators
- Manual refresh capability
- Error handling và loading states

### 4. E-RA IoT MQTT Integration

**Location**: `renderer/services/eraIotService.ts`, `renderer/services/mqttService.ts`

Real-time IoT sensor data từ E-RA IoT Platform:

- **MQTT Broker**: `mqtt1.eoh.io:1883`
- **Topic Pattern**: `eoh/chip/{token}/config/+`
- **Authentication**: Gateway token (username/password)
- **Data Format**: `{"key": value}`
- **Real-time updates** thay vì API polling

```javascript
// Configuration trong config.json
{
  "eraIot": {
    "enabled": true,
    "authToken": "Token YOUR_ERA_TOKEN_HERE",
    "baseUrl": "https://backend.eoh.io",
    "sensorConfigs": {
      "temperature": 138997,
      "humidity": 138998,
      "pm25": 138999,
      "pm10": 139000
    }
  }
}
```

**Performance Benefits**:

- Giảm server load (không còn REST API polling)
- Real-time updates (thay vì 5 phút/lần)
- Single persistent MQTT connection
- Instant data synchronization

### 5. IoTPanel Component

Hiển thị sensor data real-time:

- PM2.5, PM10 air quality từ MQTT
- Temperature và humidity sensors từ MQTT
- Real-time status indicators
- Connection status monitoring

### 6. CompanyLogo Component

Logo management system:

- Fixed, loop, và scheduled display modes
- Image rotation với configurable intervals
- Default fallback logo

## 🐛 Weather API Bug Fix Documentation

### Problem Statement

```
[Renderer] WeatherPanel: No weather data available from global service
```

### Root Cause Analysis

#### 1. TypeScript Syntax Errors

**Issues Found:**

```typescript
// Line 132: Extra closing brace
}
}  // ← This extra brace broke class structure

// Line 169: Missing class closing brace
async refreshWeatherData() {
  // method code
}
// Missing } for class
```

**Impact**: Code compilation failed, preventing WeatherService from initializing.

#### 2. Build System Architecture Issue

**Problem**: Direct editing of `app-built.js` vs template-based generation

- `build-renderer.js` generates `app-built.js` from hardcoded template
- Manual edits to `app-built.js` are overwritten on each build
- Need to edit the source template in `build-renderer.js`

#### 3. Subscription Logic Flaw

**Problem**: Race condition in GlobalWeatherServiceManager

```javascript
// BEFORE (buggy):
static subscribe(callback) {
  // ❌ instance might be null!
  const currentData = GlobalWeatherServiceManager.instance?.getCurrentWeather() || null;
  callback(currentData); // Called with null
}

// AFTER (fixed):
static subscribe(callback) {
  // ✅ Ensure instance exists first
  const instance = GlobalWeatherServiceManager.getInstance();
  const currentData = instance.getCurrentWeather() || null;
  callback(currentData);
}
```

#### 4. Asynchronous Timing Issue

**Problem**: WeatherService fetches data asynchronously but subscribers need immediate data

**Flow Analysis:**

1. WeatherPanel mounts → calls subscribe()
2. subscribe() calls getInstance() → creates WeatherService
3. WeatherService constructor starts async fetch
4. subscribe() immediately calls getCurrentWeather() → returns null (fetch not complete)
5. 1-2 seconds later: fetch completes successfully

**Solution**: Immediate notification after successful fetch

```javascript
// In WeatherService.fetchWeatherData()
this.currentData = {
  /* weather data */
};
console.log("Data updated successfully");

// ✅ KEY FIX: Notify subscribers immediately
GlobalWeatherServiceManager.notifySubscribers(this.currentData);
```

### Fix Implementation Steps

1. **Fixed TypeScript syntax errors**

   - Removed extra closing braces
   - Added missing class closing braces

2. **Fixed subscription logic in build-renderer.js**

   ```javascript
   static subscribe(callback) {
     GlobalWeatherServiceManager.subscribers.add(callback);

     // Ensure instance is created first
     const instance = GlobalWeatherServiceManager.getInstance();
     const currentData = instance.getCurrentWeather() || null;
     callback(currentData);

     return () => {
       GlobalWeatherServiceManager.subscribers.delete(callback);
     };
   }
   ```

3. **Added immediate notification after successful fetch**

   ```javascript
   // In fetchWeatherData() success path
   this.retryCount = 0;
   console.log("WeatherService: Data updated successfully");

   // Notify subscribers immediately after successful update
   GlobalWeatherServiceManager.notifySubscribers(this.currentData);
   ```

### Verification Results

```
[Renderer] GlobalWeatherServiceManager: Subscribe called, ensuring instance...
[Renderer] Creating global weather service
[Renderer] WeatherService: Initializing for TP. THỪA THIÊN HUẾ
[Renderer] WeatherService: Starting initial fetch...
[Renderer] WeatherService: Data updated successfully
[Renderer] WeatherPanel: Received weather data update: ✅ SUCCESS!
```

## 🔍 Debugging Methodology

### 1. Systematic Approach

- Start with basic syntax/compilation errors
- Layer by layer debugging (syntax → logic → timing)
- Use extensive logging to trace execution flow

### 2. Build System Understanding

- Understand how code is generated vs manually written
- Identify the correct files to edit (templates vs generated)

### 3. Async Flow Analysis

- Map out timing of async operations
- Identify race conditions and dependencies
- Implement proper notification patterns

### 4. Root Cause Focus

- Don't just fix symptoms, fix underlying causes
- Understand the complete data flow
- Test edge cases and error scenarios

## 🌤️ Weather API Integration

### OpenMeteo API Configuration

- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Location**: Huế, Vietnam (16.4637, 107.5909)
- **Data Points**: Temperature, humidity, wind, UV index, precipitation
- **Update Frequency**: 15 minutes
- **Timeout**: 15 seconds
- **Retry Strategy**: Exponential backoff with max 3 retries

### Weather Conditions Mapping

```javascript
const conditions = {
  0: "Trời quang đãng",
  1: "Chủ yếu quang đãng",
  2: "Một phần có mây",
  3: "U ám",
  45: "Sương mù",
  51: "Mưa phùn nhẹ",
  61: "Mưa nhẹ",
  95: "Dông",
  // ... more conditions
};
```

### Error Handling

- Network timeout handling
- API rate limiting protection
- Fallback data when API unavailable
- Graceful degradation with cached data

## 📊 Performance Considerations

### Memory Management

- Single WeatherService instance (Singleton pattern)
- Proper cleanup of intervals and subscriptions
- Efficient React re-rendering with useState/useEffect

### Network Optimization

- Smart caching (5-minute minimum between refreshes)
- Data age validation before API calls
- Compression and minimal payload requests

### UI Responsiveness

- Async data loading with loading states
- Click throttling (2-second minimum between clicks)
- Progressive enhancement (works offline)

## 🔐 Security Notes

### Content Security Policy

Current CSP warning needs addressing:

```
Electron Security Warning (Insecure Content-Security-Policy)
```

**Recommendations:**

- Implement strict CSP headers
- Remove `unsafe-eval` permissions
- Use nonce-based script loading

### API Security

- No API keys exposed (OpenMeteo is free/public)
- Rate limiting implemented client-side
- Input validation for all API responses

## 🚀 Deployment

### Production Build

```bash
npm run build:renderer
npm start
```

### Environment Variables

```bash
# Optional: Custom weather location
WEATHER_LAT=16.4637
WEATHER_LON=107.5909
WEATHER_CITY="TP. THỪA THIÊN HUẾ"
```

### Hardware Requirements

- **RAM**: 512MB minimum, 1GB recommended
- **Storage**: 200MB for application + logs
- **Network**: Stable internet for weather API
- **Display**: 384x384px minimum resolution

## 📝 Changelog

### v1.2.0 (2025-10-06)

- ✅ **FIXED**: Weather API integration completely working
- ✅ **FIXED**: TypeScript compilation errors
- ✅ **FIXED**: Subscription timing race conditions
- ✅ **IMPROVED**: Real-time weather data updates
- ✅ **IMPROVED**: Error handling and fallback data
- ✅ **ADDED**: Comprehensive logging system

### v1.1.0 (Previous)

- Real-time IoT sensor integration
- Company logo rotation system
- Configuration management UI

### v1.0.0 (Initial)

- Basic billboard display system
- Static weather data
- Electron + React architecture

## 🤝 Contributing

### Development Setup

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Run `npm run build:renderer` before committing
5. Submit pull request with detailed description

### Code Style

- Use TypeScript for new components
- Follow React hooks patterns
- Add comprehensive logging for debugging
- Include error handling for all async operations

### Testing

```bash
# Test weather service directly
node test-weather-service.js

# Test full application
npm run dev
```

## 📞 Support

For technical support or bug reports:

- **GitHub Issues**: [Create new issue](https://github.com/MinhQuan7/ITS_OurdoorBillboard-/issues)
- **Email**: minh.quan@company.com
- **Documentation**: See `/docs` folder for detailed guides

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Developed with ❤️ by EoH Company Team**  
_Vì cuộc sống tốt đẹp hơn_
