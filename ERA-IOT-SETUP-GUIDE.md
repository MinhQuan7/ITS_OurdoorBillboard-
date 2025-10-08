# E-Ra IoT Integration Quick Setup Guide

## Overview

The ITS Outdoor Billboard now integrates with E-Ra IoT Platform to display real-time sensor data from your IoT devices.

## Critical Issues Fixed

### 1. AUTHTOKEN Configuration

- **Issue**: Default placeholder AUTHTOKEN prevented real data access
- **Fix**: Proper config management with validation
- **Action Required**: You must configure your real AUTHTOKEN

### 2. Configuration Persistence

- **Issue**: E-Ra IoT config was not properly saved/loaded
- **Fix**: Implemented dedicated IPC handlers for E-Ra config
- **Result**: Configuration now persists between app restarts

### 3. API Response Parsing

- **Issue**: Service only handled one response format
- **Fix**: Enhanced parser handles multiple E-Ra API response formats
- **Result**: More robust sensor data extraction

### 4. Service Initialization

- **Issue**: Service might not initialize if config was invalid
- **Fix**: Added proper validation and error handling
- **Result**: Better debugging and error messages

## Setup Instructions

### Step 1: Get Your AUTHTOKEN

1. Go to https://app.e-ra.io
2. Login to your account
3. Navigate to **Profile** section
4. Copy your **AUTHTOKEN**

### Step 2: Configure the Application

1. Start the billboard application
2. Press **Ctrl+E** to open E-Ra IoT configuration panel
3. Paste your AUTHTOKEN in the configuration form
4. Click **"Test kết nối"** to verify connection
5. Click **"Lưu cấu hình"** to save

### Step 3: Verify Integration

Run the verification test:

```bash
# Set your AUTHTOKEN as environment variable
set ERA_IOT_TOKEN=Token_your_actual_token_here

# Run verification
node test-era-iot-verification.js
```

### Step 4: Monitor Operation

- Check console logs for "EraIotService" messages
- IoT Panel should show "CẢM BIẾN THÔNG MINH" with live data
- Connection indicator should show green (connected) status

## Sensor Configuration

Default sensor config IDs for Device Billboard 1:

- **Temperature**: 138997 (Nhiệt độ)
- **Humidity**: 138998 (Độ ẩm)
- **PM2.5**: 138999
- **PM10**: 139000

## Troubleshooting

### No Data Showing

1. **Check AUTHTOKEN**: Ensure you're using your real token, not the placeholder
2. **Check Console**: Look for "EraIotService" error messages
3. **Test Connection**: Use Ctrl+E → "Test kết nối"
4. **Run Verification**: `node test-era-iot-verification.js`

### "Lỗi kết nối cảm biến" Error

1. **Verify Sensor IDs**: Check if your device uses different config IDs
2. **Check E-Ra Platform**: Ensure sensors are online in E-Ra dashboard
3. **Network**: Verify internet connection to backend.eoh.io

### "Chưa cấu hình" Message

1. Open config with **Ctrl+E**
2. Enter your AUTHTOKEN
3. Save configuration

## Key Files Modified

### Service Layer

- `renderer/services/eraIotService.ts` - Enhanced API response parsing
- Added support for multiple response formats
- Improved error handling and logging

### Configuration Management

- `main.js` - Added E-Ra IoT config persistence
- `preload.js` - Added E-Ra IoT IPC handlers
- `renderer/components/EraIotConfig.tsx` - Removed placeholder token

### UI Components

- `renderer/components/BillboardLayout.tsx` - Enhanced service initialization
- `renderer/components/IoTPanel.tsx` - Better polling and error display

### Testing

- `test-era-iot-verification.js` - Comprehensive integration test
- Validates AUTHTOKEN, API connectivity, and response parsing

## Development Commands

```bash
# Start development mode
npm run dev

# Run E-Ra IoT verification test
node test-era-iot-verification.js

# Run legacy integration test
node test-era-iot-integration.js
```

## Security Notes

- AUTHTOKEN is stored securely in application config
- Never commit real AUTHTOKENs to version control
- Use environment variables for testing

## Support

If you encounter issues:

1. Check this guide and troubleshooting section
2. Run the verification test for detailed diagnostics
3. Check E-Ra IoT platform documentation
4. Review console logs for specific error messages

---

**Last Updated**: October 2025
**Integration Status**: ✅ Ready for Production
