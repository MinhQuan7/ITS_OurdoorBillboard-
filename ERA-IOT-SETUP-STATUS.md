# E-Ra IoT Integration Setup Guide

## Current Status

Your E-Ra IoT integration is **not configured yet**. Follow these steps to get it working.

## Root Cause Analysis

1. **AUTHTOKEN Missing**: You need your real AUTHTOKEN from E-Ra platform, not the placeholder
2. **Authentication Format**: The API requires specific authentication headers
3. **Configuration Not Persisted**: Real token needs to be saved to config.json

## Quick Setup (Recommended)

### Step 1: Get Your AUTHTOKEN

1. Go to https://app.e-ra.io
2. Login to your account
3. Navigate to **Profile** section
4. Copy your **AUTHTOKEN** (format: `Token 78072b06a81e166b8b900d95f4c2ba1234272955`)

### Step 2: Configure Your Token

```bash
# Method 1: Use the setup helper (recommended)
node setup-era-token.js

# Method 2: Set environment variable
$env:ERA_IOT_TOKEN="Token 78072b06a81e166b8b900d95f4c2ba1234272955"

# Method 3: Edit config.json manually
# Open config.json and update eraIot.authToken field
```

### Step 3: Verify Setup

```bash
# Run comprehensive diagnostic
node diagnose-era-system.js

# Test API connectivity
node test-era-api-comprehensive.js

# Run verification test
node test-era-iot-verification.js
```

### Step 4: Start Application

```bash
npm run dev
```

## API Documentation Reference

Based on the API endpoint you provided: `https://backend.eoh.io/redoc/#tag/chip_manager/operation/chip_manager_configs_delete`

### Current Implementation

- **Base URL**: `https://backend.eoh.io`
- **Endpoint**: `/api/chip_manager/configs/{id}/current_value/`
- **Authentication**: `Authorization: Token your_authtoken_here`
- **Method**: GET

### Sensor Configuration IDs

```json
{
  "temperature": 138997, // Nhiệt độ
  "humidity": 138998, // Độ ẩm
  "pm25": 138999, // PM 2.5
  "pm10": 139000 // PM10
}
```

## Troubleshooting

### Common Issues

#### 1. API Returns 401 (Unauthorized)

```bash
# Check your AUTHTOKEN
node setup-era-token.js
```

#### 2. API Returns 404 (Not Found)

- Verify sensor config IDs match your E-Ra device
- Check if sensors are configured in E-Ra platform

#### 3. Empty or Invalid Response Data

- Use the comprehensive API tester:

```bash
node test-era-api-comprehensive.js
```

#### 4. Network/Connection Issues

- Check internet connectivity
- Verify `backend.eoh.io` is accessible
- Check firewall settings

### Advanced Diagnostics

#### Full System Check

```bash
node diagnose-era-system.js
```

#### API Testing with Multiple Auth Methods

```bash
node test-era-api-comprehensive.js
```

#### Manual Verification

```bash
node test-era-iot-verification.js
```

## Implementation Details

### Value Extraction Logic

The service handles multiple response formats:

```typescript
// Direct number
response.data = 25.6;

// Object with current_value_only
response.data = { current_value_only: 25.6 };

// Object with current_value
response.data = { current_value: 25.6 };

// Array format
response.data = [{ current_value_only: 25.6 }];
```

### Authentication Methods Supported

1. **Standard Token**: `Authorization: Token your_token`
2. **Bearer Token**: `Authorization: Bearer your_token`
3. **API Key Header**: `X-API-Key: your_token`
4. **Custom Header**: `apiKey: your_token`

## Current Configuration

Check your current setup:

```bash
cat config.json | grep -A 15 "eraIot"
```

## Files Updated

- `config.json` - Added E-Ra IoT configuration section
- `renderer/services/eraIotService.ts` - Enhanced value extraction
- `test-era-iot-verification.js` - Improved to load saved config
- `setup-era-token.js` - Token setup helper (NEW)
- `test-era-api-comprehensive.js` - API testing tool (NEW)
- `diagnose-era-system.js` - System diagnostic (NEW)

## Next Steps

1. **IMMEDIATE**: Run `node setup-era-token.js` with your real AUTHTOKEN
2. **VERIFY**: Run `node diagnose-era-system.js` to confirm everything works
3. **LAUNCH**: Run `npm run dev` to see live sensor data
4. **MONITOR**: Check console logs for any runtime issues

## Support

If issues persist after following this guide:

1. Save the output of `node diagnose-era-system.js`
2. Run `node test-era-api-comprehensive.js` and save results
3. Check E-Ra platform for sensor status
4. Contact E-Ra support with diagnostic information

---

**Status**: Setup required - follow Step 1-4 above  
**Priority**: High - API integration needed for IoT panel functionality  
**Updated**: October 8, 2025
