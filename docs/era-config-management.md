# E-Ra IoT Configuration Management Feature

## Overview

This feature replaces the hardcoded sensor configuration IDs with a dynamic configuration system that allows users to map their E-Ra IoT datastreams to the application's sensor types.

## Problem Solved

Previously, the system used hardcoded sensor configuration IDs:

```javascript
sensorConfigs: {
  temperature: 138997, // Fixed ID
  humidity: 138998,    // Fixed ID
  pm25: 138999,        // Fixed ID
  pm10: 139000,        // Fixed ID
}
```

This caused issues when users:

- Added new sensors to their E-Ra platform
- Had different sensor IDs than the hardcoded ones
- Wanted to use different sensors for the same data types

## Solution

The new system provides:

1. **Dynamic Configuration**: Fetch available chips and datastreams from E-Ra API
2. **User Mapping**: Allow users to map their datastreams to application sensor types
3. **Auto-Detection**: Automatically detect sensor mappings based on names
4. **Configuration Persistence**: Save user mappings to system configuration

## How to Use

### 1. Login to E-Ra Platform

- Navigate to the "Login" tab in the configuration interface
- Enter your E-Ra platform credentials
- Ensure successful authentication

### 2. Access E-Ra Configuration

- Click on the "E-Ra Config" navigation item
- The configuration management interface will be displayed

### 3. Fetch Configuration

- Click "Get E-Ra Configuration" button
- The system will fetch all available chips and datastreams from your E-Ra account
- Available chips and datastreams will be displayed

### 4. Map Sensors

- **Manual Mapping**: Use the dropdown selectors to map each sensor type
  - Temperature Sensor
  - Humidity Sensor
  - PM2.5 Sensor
  - PM10 Sensor
- **Auto-Detection**: Click "Auto-Detect Mapping" to automatically match sensors based on names

### 5. Save Configuration

- Click "Save Sensor Mapping" to persist the configuration
- Test the mapping with "Test Configuration" button
- The system will update the IoT service with the new sensor IDs

## API Endpoints Used

### Get Chips

```
GET https://backend.eoh.io/api/chip_manager/developer_mode_chips/
```

Returns list of all chips in the user's E-Ra account.

### Get Datastreams

```
GET https://backend.eoh.io/api/chip_manager/configs/
```

Returns list of all datastream configurations for the user's chips.

## Technical Implementation

### Files Added/Modified

#### New Files:

- `renderer/services/eraConfigService.ts` - TypeScript service for E-Ra configuration
- `renderer/services/eraConfigService.js` - JavaScript version for web use

#### Modified Files:

- `renderer/config.html` - Added E-Ra Config navigation and UI elements
- `renderer/config.js` - Added configuration management functionality

### Key Components

#### EraConfigService

Handles API communication with E-Ra platform:

- Fetches chips and datastreams
- Parses API responses
- Manages sensor mappings
- Provides auto-detection functionality

#### Configuration UI

- Navigation item for E-Ra Config
- Chips and datastreams display
- Sensor mapping interface
- Status indicators and feedback

#### Integration

- Uses existing authentication service for API calls
- Integrates with system configuration storage
- Updates IoT service with new sensor mappings

## Benefits

1. **Flexibility**: Users can map any E-Ra datastream to any sensor type
2. **Scalability**: Easy to add new sensors without code changes
3. **User-Friendly**: Visual interface for configuration management
4. **Reliability**: Auto-detection reduces manual configuration errors
5. **Persistence**: Configuration is saved and restored automatically

## Future Enhancements

- Real-time sensor value testing
- Bulk sensor configuration import/export
- Advanced filtering and search for large sensor lists
- Historical data visualization for mapped sensors
- Multi-device support for complex IoT setups

## Usage Notes

- Requires valid E-Ra platform authentication
- Internet connection needed for API calls
- Configuration is saved locally and persists across sessions
- Auto-detection works best with descriptive sensor names
- Test functionality verifies mapping correctness
