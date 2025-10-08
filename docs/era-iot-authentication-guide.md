# E-Ra IoT Authentication & Integration Guide

## Overview

This guide explains how to properly configure E-Ra IoT authentication for the Billboard system.

## Current Issues Identified

### 1. Authentication Problems

- **Root Cause**: Missing or incorrect AUTHTOKEN
- **Current Status**: Using placeholder/test token
- **Impact**: API calls return 404/401 errors

### 2. API Authentication Format

Based on E-Ra IoT documentation analysis, the correct authentication format is:

```
Authorization: Token [YOUR-AUTHTOKEN-HERE]
```

## Step-by-Step Fix

### Step 1: Get Your Real AUTHTOKEN

1. **Login to E-Ra Platform**

   - Go to: https://app.e-ra.io
   - Login with your credentials

2. **Access Profile**

   - Click on your profile picture/avatar
   - Select "Profile" from dropdown menu

3. **Copy AUTHTOKEN**
   - Scroll down to find "AUTHTOKEN" section
   - Copy the entire token (should be a long string of characters)
   - Format will be like: `Token abc123def456ghi789...`

### Step 2: Update Configuration

#### Option A: Through Application UI

1. Run the application: `npm run dev`
2. Press `Ctrl+E` to open E-Ra IoT configuration
3. Paste your AUTHTOKEN in the "AUTHTOKEN" field
4. Click "Test kết nối" to verify connection
5. Click "Lưu cấu hình" to save

#### Option B: Direct File Edit

1. Edit `renderer/components/EraIotConfig.tsx`
2. Replace the empty `authToken` with your real token:

```typescript
authToken: "Token YOUR-REAL-TOKEN-HERE",
```

### Step 3: Test Integration

Run the integration test:

```bash
# First, update the test file
# Edit test-era-iot-integration.js and replace authToken with your real token

node test-era-iot-integration.js
```

Expected successful output:

```
✅ API connection successful
✅ Temperature: [value] (valid)
✅ Humidity: [value] (valid)
✅ PM2.5: [value] (valid)
✅ PM10: [value] (valid)
🎉 SUCCESS: E-Ra IoT integration is fully functional!
```

## Sensor Configuration

Current sensor config IDs (for Billboard Device 1):

- **Temperature**: 138997
- **Humidity**: 138998
- **PM2.5**: 138999
- **PM10**: 139000

## API Endpoints

Base URL: `https://backend.eoh.io`

### Get Sensor Value

```
GET /api/chip_manager/configs/{config_id}/current_value/
Headers:
  Authorization: Token [YOUR-AUTHTOKEN]
  Accept: application/json
  Content-Type: application/json
```

Response format:

```json
{
  "current_value_only": 25.6
}
```

## Troubleshooting

### Common Errors

#### 1. 404 Not Found

- **Cause**: Invalid sensor config ID or wrong API endpoint
- **Solution**: Verify config IDs match your E-Ra device configuration

#### 2. 401 Unauthorized

- **Cause**: Invalid or expired AUTHTOKEN
- **Solution**: Get fresh AUTHTOKEN from E-Ra platform

#### 3. 403 Forbidden

- **Cause**: AUTHTOKEN doesn't have access to requested resources
- **Solution**: Check device permissions in E-Ra platform

#### 4. Connection Timeout

- **Cause**: Network issues or server problems
- **Solution**: Check internet connection and E-Ra server status

### Debug Steps

1. **Verify Token Format**

   ```javascript
   // Correct format:
   "Token abc123def456ghi789jkl012mno345pqr678stu"

   // Incorrect formats:
   "Bearer abc123..."
   "abc123..." (without "Token " prefix)
   ```

2. **Test Manual API Call**

   ```bash
   curl -H "Authorization: Token YOUR-TOKEN-HERE" \
        https://backend.eoh.io/chip_manager/configs/138997/current_value/
   ```

3. **Check Console Logs**
   - Open browser developer tools
   - Look for network errors in Console tab
   - Check Network tab for failed API requests

## Security Notes

- **Never commit AUTHTOKEN to version control**
- **Store AUTHTOKEN securely**
- **Regularly rotate AUTHTOKEN if compromised**
- **Use environment variables for production deployment**

## Implementation Status

### Fixed Issues ✅

- Corrected authentication header format in `eraIotService.ts`
- Added proper error handling and diagnostics
- Updated configuration UI to require real AUTHTOKEN
- Enhanced test suite with better error messages

### Pending Actions ⚠️

- **USER ACTION REQUIRED**: Get and configure real AUTHTOKEN
- Test with actual E-Ra platform credentials
- Verify sensor config IDs match your device setup
- Update production deployment with secure token management

## Next Steps

1. **Immediate (Required)**

   - Obtain real AUTHTOKEN from https://app.e-ra.io/profile
   - Update configuration with real token
   - Run integration test to verify connection

2. **Short Term**

   - Implement secure token storage
   - Add token refresh mechanism
   - Set up monitoring for API failures

3. **Long Term**
   - Implement fallback data sources
   - Add real-time error notifications
   - Create admin dashboard for IoT management

## Contact Information

For E-Ra IoT Platform support:

- Email: support@eoh.io
- Phone: +84938191073
- Platform: https://app.e-ra.io
