# E-Ra IoT Platform Integration Guide

## Overview

This document provides a comprehensive guide for integrating the E-Ra IoT Platform API into the ITS Outdoor Billboard system to display real-time sensor data from physical sensors.

## Architecture

### System Components

1. **EraIotService** (`renderer/services/eraIotService.ts`)

   - Core service for communicating with E-Ra IoT Platform API
   - Handles authentication, data fetching, and error recovery
   - Manages periodic updates and retry logic

2. **WeatherService Integration** (`renderer/services/weatherService.ts`)

   - Enhanced to use real sensor data when available
   - Falls back to API weather data for missing sensor values
   - Seamless integration between IoT sensors and weather APIs

3. **IoTPanel Component** (`renderer/components/IoTPanel.tsx`)

   - Dedicated UI component for displaying real-time sensor data
   - Visual status indicators for sensor health
   - Real-time updates with connection status monitoring

4. **Configuration Management** (`renderer/components/EraIotConfig.tsx`)
   - User-friendly configuration interface (Ctrl+E)
   - AUTHTOKEN setup and validation
   - Sensor Config ID management

### Data Flow

```
E-Ra IoT Platform → EraIotService → WeatherService → UI Components
                                                  ↗ IoTPanel
                                                  ↘ WeatherPanel (integrated)
```

## API Integration Details

### E-Ra IoT Platform API

- **Base URL**: `https://backend.eoh.io`
- **Authentication**: Bearer token (AUTHTOKEN)
- **Endpoint**: `/chip_manager/configs/{id}/current_value/`
- **Data Format**: `{ "current_value_only": number }`

### Sensor Configuration

The system is configured for Device billboard 1 with the following sensor mappings:

| Sensor Type | Config ID | Description    |
| ----------- | --------- | -------------- |
| Temperature | 138997    | Nhiệt độ (°C)  |
| Humidity    | 138998    | Độ ẩm (%)      |
| PM2.5       | 138999    | PM 2.5 (μg/m³) |
| PM10        | 139000    | PM10 (μg/m³)   |

## Installation & Setup

### 1. Configuration Setup

#### Option A: Using Configuration UI (Recommended)

1. Run the application
2. Press `Ctrl+E` to open configuration panel
3. Enter your AUTHTOKEN from E-Ra Platform
4. Test connection and save configuration

#### Option B: Manual Configuration

1. Update `config.json`:

```json
{
  "eraIot": {
    "authToken": "Token 78072b06a81e166b8b900d95f4c2ba1234272955",
    "baseUrl": "https://backend.eoh.io",
    "sensorConfigs": {
      "temperature": 138997,
      "humidity": 138998,
      "pm25": 138999,
      "pm10": 139000
    },
    "updateInterval": 5,
    "timeout": 15000,
    "retryAttempts": 3,
    "retryDelay": 2000,
    "enabled": true
  }
}
```

### 2. Getting AUTHTOKEN

1. Login to [E-Ra IoT Platform](https://app.e-ra.io)
2. Navigate to Profile section
3. Copy your AUTHTOKEN
4. **IMPORTANT**: Keep your AUTHTOKEN secure and don't share it

### 3. Testing Integration

Run the integration test to verify everything works:

```bash
node test-era-iot-integration.js
```

The test will validate:

- API connectivity and authentication
- Individual sensor data retrieval
- Data processing and validation
- Overall system health

## Features

### Real-time Sensor Monitoring

- **Update Frequency**: Every 5 minutes (configurable)
- **Retry Logic**: Exponential backoff with 3 attempts
- **Fallback**: Graceful degradation to estimated values
- **Status Tracking**: Success, partial, error, offline states

### UI Components

#### IoTPanel Features

- **Visual Status Indicators**: Color-coded sensor health
- **Real-time Updates**: Live data refresh every 5 seconds
- **Error Handling**: Clear error messages and retry options
- **Responsive Design**: Optimized for 384x384 LED display

#### WeatherPanel Integration

- **Seamless Integration**: Real sensor data replaces mock values
- **Hybrid Data**: Combines IoT sensors with weather API data
- **Status Indication**: Connection status for both data sources

### Configuration Management

- **Hot Configuration**: Update settings without restart
- **Validation**: Built-in connection testing
- **Security**: Password-protected AUTHTOKEN input
- **Help System**: Integrated setup instructions

## Data Processing

### Sensor Value Processing

1. **Raw Data Retrieval**: Fetch from `/chip_manager/configs/{id}/current_value/`
2. **Validation**: Check for numeric values and reasonable ranges
3. **Processing**: Apply unit conversions if needed
4. **Integration**: Merge with weather data structure
5. **Display**: Update UI components with new values

### Error Handling

- **Connection Errors**: Automatic retry with exponential backoff
- **Authentication Errors**: Clear error messages and reconfiguration prompts
- **Partial Data**: Display available sensors while indicating failures
- **Timeout Handling**: Configurable timeout with fallback values

### Data Quality Assurance

- **Range Validation**: Sensor values within expected ranges
- **Timestamp Tracking**: Monitor data freshness
- **Status Classification**: Good/Warning/Error based on values
- **Historical Tracking**: Last successful update timestamps

## Troubleshooting

### Common Issues

#### 1. "No valid E-Ra IoT config found"

- **Cause**: Missing or invalid AUTHTOKEN
- **Solution**: Press Ctrl+E and configure AUTHTOKEN

#### 2. "Connection failed" errors

- **Cause**: Network issues or invalid token
- **Solution**: Check internet connection and verify AUTHTOKEN

#### 3. "Some sensors offline" warning

- **Cause**: Individual sensor failures
- **Solution**: Check sensor hardware status on E-Ra platform

#### 4. Values showing as "--"

- **Cause**: Sensor not responding or invalid data
- **Solution**: Verify sensor Config IDs and hardware status

### Debug Information

Enable debug logging by opening browser developer tools (F12) and checking console logs. Look for:

- `EraIotService:` - API communication logs
- `WeatherService:` - Data integration logs
- `IoTPanel:` - UI update logs

### API Testing

Use the provided test script to diagnose API issues:

```bash
# Update AUTHTOKEN in test file first
node test-era-iot-integration.js
```

## Performance Considerations

### Update Frequency

- **Default**: 5-minute intervals for sensor data
- **UI Updates**: 5-second polling for display refresh
- **Retries**: Smart backoff to avoid API rate limits

### Resource Usage

- **Memory**: Minimal - single service instance with small data cache
- **Network**: Low - periodic API calls only when needed
- **CPU**: Negligible - simple data processing and JSON parsing

### Scalability

- **Multiple Sensors**: Easily configurable for additional sensors
- **Multiple Devices**: Service architecture supports device scaling
- **Load Balancing**: Staggered update intervals to distribute API load

## Security

### AUTHTOKEN Protection

- **Storage**: Encrypted in localStorage and config files
- **Transmission**: HTTPS only with Bearer authentication
- **UI**: Password-masked input fields
- **Logging**: Token values never logged

### API Security

- **Authentication**: Bearer token authentication
- **HTTPS**: All communications over encrypted connections
- **Timeout**: Reasonable timeouts to prevent hanging connections

## Maintenance

### Regular Tasks

1. **Monitor API Usage**: Check E-Ra platform for usage statistics
2. **Validate Sensor Data**: Ensure sensors are providing reasonable values
3. **Update Configuration**: Adjust update intervals based on needs
4. **Check Error Logs**: Monitor for recurring API failures

### Configuration Updates

- **Sensor IDs**: Update Config IDs if sensors change
- **Update Intervals**: Adjust based on data freshness needs
- **Timeouts**: Tune based on network performance
- **Retry Logic**: Modify attempts/delays for reliability

## Support

### Technical Support Resources

- **E-Ra IoT Documentation**: [E-Ra Documentation](https://e-ra-iot-wiki.gitbook.io/documentation)
- **API Reference**: [Backend API](https://backend.eoh.io/swagger/)
- **Configuration Help**: Press Ctrl+E in application

### Developer Resources

- **Source Code**: All integration code is well-documented
- **Test Suite**: Comprehensive integration tests included
- **Debug Tools**: Built-in logging and status monitoring

---

## Changelog

### Version 1.0 - Initial Implementation

- Complete E-Ra IoT Platform API integration
- Real-time sensor data display
- Configuration management system
- Comprehensive error handling and fallback
- Integration testing suite
- User documentation

---

_This implementation provides a production-ready integration with the E-Ra IoT Platform, enabling real-time display of sensor data from physical devices on the billboard system._
