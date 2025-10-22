# E-RA IoT MQTT Migration Guide

## Tóm tắt thay đổi

Hệ thống đã được cập nhật từ REST API polling sang MQTT real-time streaming để cải thiện hiệu năng và giảm tải cho server.

### Thay đổi chính:

1. **Loại bỏ API polling** cho việc lấy giá trị sensor (temperature, humidity, pm25, pm10)
2. **Thêm MQTT integration** với E-RA IoT Platform
3. **Giữ nguyên API authentication** và config management
4. **Real-time updates** thay vì polling mỗi 5 phút

## Cấu hình MQTT E-RA

### Broker Information:

- **Broker**: `mqtt1.eoh.io`
- **Port**: `1883`
- **Protocol**: MQTT over TCP

### Authentication:

- **Username**: Gateway Token (extracted from authToken)
- **Password**: Gateway Token (same as username)

### Topic Pattern:

- **Subscribe**: `eoh/chip/{token}/config/+`
- **LWT**: `eoh/chip/{token}/lwt`

### Message Format:

```json
{"key": value}
```

Ví dụ:

```json
{"temperature": 25.6}
{"humidity": 65.2}
```

### QoS và Retention:

- **QoS**: 1 (At least once delivery)
- **Retained**: true (Last message saved by broker)

## Sensor Configuration

Sensor mapping vẫn giữ nguyên trong config.json:

```json
{
  "eraIot": {
    "enabled": true,
    "authToken": "Token YOUR_REAL_TOKEN_HERE",
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
    "retryDelay": 2000
  }
}
```

## Code Changes

### MQTT Service (`mqttService.ts`)

- **Broker**: Hardcoded to `mqtt1.eoh.io:1883`
- **Authentication**: Uses gateway token for both username and password
- **Topic subscription**: `eoh/chip/{token}/config/+`
- **Message parsing**: Handles E-RA format `{"key": value}`
- **Config ID mapping**: Maps config IDs to sensor types

### E-RA IoT Service (`eraIotService.ts`)

- **Removed**: REST API calls for sensor values
- **Kept**: API-based authentication and config management
- **Added**: MQTT service integration
- **Real-time**: Data updates via MQTT callbacks

### IoT Panel (`IoTPanel.tsx`)

- **No changes**: Component continues to work with real-time data
- **Improved**: Now receives updates every second via MQTT
- **Maintained**: All UI logic and error handling

## Testing

### Connection Test:

```bash
node test-era-mqtt-simple.js
```

### Integration Test:

```bash
node test-era-mqtt-integration.js
```

### Expected Output:

```
E-Ra MQTT Configuration Test
============================
Broker: mqtt1.eoh.io:1883
Username: 78072b06a8...
Topic: eoh/chip/{token}/config/+

✅ Successfully connected to E-Ra MQTT broker!
✅ Successfully subscribed to: eoh/chip/{token}/config/+

📨 [14:30:25] eoh/chip/{token}/config/138997: {"temperature": 25.6}
   Config ID: 138997
   Sensor: temperature
```

## Troubleshooting

### 1. Connection Refused: Not authorized

- **Nguyên nhân**: Token không hợp lệ hoặc là placeholder
- **Giải pháp**: Thay thế authToken bằng token thật từ E-RA platform

### 2. No messages received

- **Nguyên nhân**: Gateway offline hoặc không publish data
- **Giải pháp**: Kiểm tra gateway status trên E-RA platform

### 3. Config ID không map được

- **Nguyên nhân**: Sensor config IDs không đúng
- **Giải pháp**: Cập nhật sensor config IDs trong config.json

### 4. Message format không đúng

- **Nguyên nhân**: E-RA publish format khác
- **Giải pháp**: Kiểm tra và cập nhật message parsing logic

## Migration Steps

### Để sử dụng hệ thống mới:

1. **Cập nhật authToken**:

   ```json
   "authToken": "Token YOUR_REAL_ERA_TOKEN"
   ```

2. **Verify sensor config IDs**:

   - Kiểm tra các ID 138997, 138998, 138999, 139000 có đúng không
   - Cập nhật nếu cần thiết

3. **Test connection**:

   ```bash
   node test-era-mqtt-simple.js
   ```

4. **Run application**:

   ```bash
   npm run dev
   ```

5. **Monitor IoT panel**: Kiểm tra data real-time trong ứng dụng

## Performance Benefits

### Trước (REST API):

- Polling mỗi 5 phút
- Multiple HTTP requests
- Server load cao
- Delay trong cập nhật

### Sau (MQTT):

- Real-time streaming
- Single persistent connection
- Server load thấp
- Instant updates

## Security

- **Authentication**: Sử dụng gateway token
- **Encryption**: MQTT over TLS (nếu cần)
- **Authorization**: Topic-based access control
- **Token management**: Giữ nguyên API-based auth

## Support

Nếu gặp vấn đề:

1. Kiểm tra logs trong console
2. Verify network connectivity
3. Test với `test-era-mqtt-simple.js`
4. Contact E-RA support nếu cần
