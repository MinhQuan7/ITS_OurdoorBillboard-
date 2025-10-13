# E-Ra IoT MQTT Integration Guide

## Overview

This document describes the new MQTT.js integration for E-Ra IoT Platform, replacing the previous REST API polling approach with real-time MQTT data streaming.

## Key Changes

### From REST API to MQTT

- **Before**: Periodic HTTP API calls every 5 minutes
- **After**: Real-time MQTT data streaming with instant updates
- **Benefit**: Lower latency, reduced server load, real-time responsiveness

### New Dependencies

- `mqtt ^5.0.0` - MQTT client library for Node.js/Browser
- Real-time data flow via WebSocket-based MQTT connection

## Architecture

### MQTT Service (`mqttService.ts`)

Core service handling MQTT connection, topic subscription, and data processing:

```typescript
// Key interfaces
interface MqttConfig {
  brokerUrl: string;           // MQTT broker URL
  gatewayToken: string;        // Extracted from authToken
  mqttApiKey: string;          // MQTT authentication key
  sensorConfigs: {...};        // Sensor configuration mapping
}

interface MqttSensorData {
  temperature: number | null;
  humidity: number | null;
  pm25: number | null;
  pm10: number | null;
  timestamp: Date;
}
```

### Era IoT Service (`eraIotService.ts`)

Updated to use MQTT service internally while maintaining the same public interface for compatibility:

```typescript
class EraIotService {
  private mqttService: MqttService;

  async startPeriodicUpdates(): Promise<void> {
    // Now connects to MQTT instead of starting HTTP polling
    await this.mqttService.connect();
  }
}
```

## Configuration

### Updated config.json Schema

```json
{
  "eraIot": {
    "enabled": true,
    "authToken": "Token YOUR_GATEWAY_TOKEN_HERE",
    "baseUrl": "https://backend.eoh.io",
    "mqttApiKey": "YOUR_MQTT_API_KEY_HERE",
    "sensorConfigs": {
      "temperature": 138997,
      "humidity": 138998,
      "pm25": 138999,
      "pm10": 139000
    },
    "timeout": 15000,
    "retryAttempts": 3,
    "retryDelay": 2000
  }
}
```

### New Configuration Fields

- `mqttApiKey`: Required for MQTT broker authentication
- `authToken`: Gateway token extracted automatically (Token prefix required)

## MQTT Connection Details

### Broker Configuration

- **Host**: `backend.eoh.io` (derived from baseUrl)
- **Port**: `1883` (standard MQTT port)
- **Protocol**: `mqtt://` (can be upgraded to `mqtts://` for SSL)

### Authentication

- **Username**: GATEWAY_TOKEN (extracted from authToken)
- **Password**: MQTT_API_KEY (from configuration)
- **Client ID**: `billboard_{gateway_token}_{timestamp}`

### Topic Structure

Primary topic pattern: `eoh/chip/{GATEWAY_TOKEN}/#`

Specific sensor topics:

- `eoh/chip/{GATEWAY_TOKEN}/sensor/{temperature_config_id}`
- `eoh/chip/{GATEWAY_TOKEN}/sensor/{humidity_config_id}`
- `eoh/chip/{GATEWAY_TOKEN}/sensor/{pm25_config_id}`
- `eoh/chip/{GATEWAY_TOKEN}/sensor/{pm10_config_id}`

Alternative topic patterns (also supported):

- `eoh/chip/{GATEWAY_TOKEN}/data/temperature`
- `eoh/chip/{GATEWAY_TOKEN}/data/humidity`
- `eoh/chip/{GATEWAY_TOKEN}/data/pm25`
- `eoh/chip/{GATEWAY_TOKEN}/data/pm10`

## Data Flow

### Real-time Data Processing

1. **MQTT Connection**: Service connects to broker on startup
2. **Topic Subscription**: Subscribes to all relevant sensor topics
3. **Message Reception**: Receives real-time sensor data
4. **Data Parsing**: Handles various message formats (JSON/plain text)
5. **State Update**: Updates application state immediately
6. **UI Refresh**: Components receive instant updates

### Message Format Support

The MQTT service handles multiple message formats:

```javascript
// JSON format
{"current_value_only": 25.5}
{"current_value": 25.5}
{"value": 25.5}

// Plain text format
"25.5"

// Numeric format
25.5
```

## Setup Instructions

### 1. Obtain MQTT Credentials

1. Login to E-Ra IoT Platform
2. Navigate to MQTT settings
3. Generate/obtain your MQTT_API_KEY
4. Note your GATEWAY_TOKEN (from existing authToken)

### 2. Update Configuration

Update `config.json`:

```json
{
  "eraIot": {
    "authToken": "Token YOUR_REAL_GATEWAY_TOKEN",
    "mqttApiKey": "YOUR_REAL_MQTT_API_KEY"
  }
}
```

### 3. Configuration UI

Press `Ctrl+E` in the application to open configuration panel:

- Enter your real AUTHTOKEN
- Enter your MQTT API Key
- Test connection
- Save configuration

### 4. Verify Connection

Run the test script:

```bash
node test-era-mqtt-integration.js
```

## Testing

### MQTT Integration Test

The test script `test-era-mqtt-integration.js` validates:

1. **Configuration Validation**

   - Gateway token extraction
   - MQTT API key presence
   - Broker URL derivation

2. **MQTT Connection**

   - Broker connectivity
   - Authentication success
   - Topic subscription

3. **Data Reception**
   - Message parsing
   - Sensor data mapping
   - Real-time updates

### Running Tests

```bash
# Test MQTT integration
node test-era-mqtt-integration.js

# Test with environment variables
ERA_IOT_TOKEN="Token your_token" ERA_MQTT_API_KEY="your_key" node test-era-mqtt-integration.js
```

## Troubleshooting

### Common Issues

1. **Connection Failed**

   - Verify MQTT_API_KEY is correct
   - Check network connectivity to backend.eoh.io:1883
   - Ensure GATEWAY_TOKEN extraction is working

2. **No Data Received**

   - Verify your E-Ra device is online and publishing
   - Check topic subscription patterns
   - Confirm sensor config IDs match your device setup

3. **Authentication Errors**
   - Validate GATEWAY_TOKEN format (should not contain "Token " prefix)
   - Ensure MQTT_API_KEY has proper permissions
   - Check if user/ACL is properly configured in E-Ra platform

### Debug Information

Enable verbose logging by checking browser console:

- MQTT connection status
- Topic subscriptions
- Message reception
- Data parsing results

## API Reference

### MqttService Methods

```typescript
// Connection management
async connect(): Promise<void>
async disconnect(): Promise<void>
async testConnection(): Promise<{success: boolean, message: string}>

// Data access
getCurrentData(): MqttSensorData
getStatus(): MqttConnectionStatus

// Event subscriptions
onDataUpdate(callback: Function): Function // Returns unsubscribe function
onStatusUpdate(callback: Function): Function

// Configuration
updateConfig(newConfig: Partial<MqttConfig>): void
destroy(): void
```

### EraIotService Compatibility

The existing EraIotService interface remains unchanged, ensuring backward compatibility:

```typescript
// All existing methods still work
async startPeriodicUpdates(): Promise<void>
async stopPeriodicUpdates(): Promise<void>
getCurrentData(): EraIotData | null
async testConnection(): Promise<{success: boolean, message: string}>
```

## Performance Benefits

### Real-time Updates

- **Latency**: ~100ms vs 5-minute polling intervals
- **Responsiveness**: Instant UI updates on sensor changes
- **Efficiency**: Only transmits when data changes

### Resource Usage

- **Network**: Reduced HTTP overhead, persistent connection
- **Server**: Lower API server load
- **Client**: Event-driven updates, no periodic polling

## Migration from API to MQTT

### Backwards Compatibility

- Existing `EraIotData` interface unchanged
- Same configuration structure (with additional MQTT fields)
- Identical component integration

### Key Differences

- Real-time vs periodic updates
- Connection-based vs request-based
- Push vs pull data model

## Security Considerations

### MQTT Authentication

- Username/password authentication required
- Client-specific credentials (GATEWAY_TOKEN + MQTT_API_KEY)
- ACL permissions control topic access

### Network Security

- Consider upgrading to `mqtts://` (MQTT over SSL) for production
- Firewall rules for port 1883 outbound
- VPN or secure network recommended for sensitive deployments

## Future Enhancements

### Planned Features

1. **SSL/TLS Support**: Upgrade to secure MQTT connection
2. **Reconnection Strategy**: Enhanced auto-reconnection logic
3. **Quality of Service**: Implement MQTT QoS levels
4. **Message Buffering**: Handle offline scenarios
5. **Multiple Brokers**: Failover broker support

### Advanced Configuration

```json
{
  "eraIot": {
    "mqtt": {
      "ssl": true,
      "port": 8883,
      "qos": 1,
      "retain": false,
      "keepalive": 60,
      "clean": true
    }
  }
}
```

---

## Support & Contact

For MQTT integration issues:

1. Check this documentation first
2. Run the test script for diagnosis
3. Review browser console logs
4. Contact E-Ra IoT support for MQTT_API_KEY issues

**Last Updated**: October 2025  
**Version**: 2.0 (MQTT Integration)
