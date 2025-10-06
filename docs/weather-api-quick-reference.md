# Weather API Quick Reference

## API Configuration Summary

### Current Setup

```
API Provider: OpenWeatherMap v2.5
Location: Thừa Thiên Huế, Vietnam
Coordinates: 16.4637°N, 107.5909°E
Update Frequency: Every 15 minutes
Timeout: 15 seconds per request
```

### Data Points Retrieved

| Data Point        | Source          | Unit  | Vietnamese    |
| ----------------- | --------------- | ----- | ------------- |
| Temperature       | Current Weather | °C    | Nhiệt độ      |
| Feels Like        | Current Weather | °C    | Cảm giác      |
| Humidity          | Current Weather | %     | Độ ẩm         |
| Wind Speed        | Current Weather | km/h  | Gió           |
| UV Index          | Forecast        | 0-11+ | UV            |
| Rain Probability  | Forecast        | %     | Khả năng mưa  |
| Visibility        | Current Weather | km    | Tầm nhìn      |
| Air Quality       | Air Pollution   | 1-5   | Chất lượng KK |
| Weather Condition | Current Weather | Text  | Tình trạng    |

### Air Quality Index Scale

```
1 = Tốt          (Good)       🟢 Green
2 = Khá          (Fair)       🟡 Yellow
3 = Trung bình   (Moderate)   🟠 Orange
4 = Kém          (Poor)       🔴 Red
5 = Rất kém      (Very Poor)  🟣 Purple
```

### Weather Condition Translations

#### Clear / Sunny

- clear sky → Trời quang đãng
- sky is clear → Trời quang đãng

#### Clouds

- few clouds → Ít mây
- scattered clouds → Mây rải rác
- broken clouds → Nhiều mây
- overcast clouds → U ám

#### Rain

- light rain → Mưa nhẹ
- moderate rain → Mưa vừa
- heavy intensity rain → Mưa to
- shower rain → Mưa rão

#### Drizzle

- drizzle → Mưa phùn
- light intensity drizzle → Mưa phùn nhẹ
- heavy intensity drizzle → Mưa phùn to

#### Thunderstorm

- thunderstorm → Dông
- thunderstorm with rain → Dông có mưa
- heavy thunderstorm → Dông mạnh

#### Atmosphere

- mist → Sương mù
- fog → Sương mù dày
- haze → Sương mù mờ
- smoke → Khói

#### Snow

- light snow → Tuyết nhẹ
- snow → Tuyết
- heavy snow → Tuyết to

### API Endpoints Used

```typescript
// 1. Current Weather
GET https://api.openweathermap.org/data/2.5/weather
Params: lat, lon, appid, units=metric, lang=vi

// 2. Forecast (for UV & Rain %)
GET https://api.openweathermap.org/data/2.5/forecast
Params: lat, lon, appid, units=metric, cnt=1

// 3. Air Pollution (AQI)
GET https://api.openweathermap.org/data/2.5/air_pollution
Params: lat, lon, appid
```

### Error Codes & Handling

| Error Code | Meaning             | Action                  |
| ---------- | ------------------- | ----------------------- |
| 401        | Invalid API Key     | Check key configuration |
| 404        | Location not found  | Verify coordinates      |
| 429        | Rate limit exceeded | Reduce update frequency |
| 500        | Server error        | Use fallback API        |
| Timeout    | Network issue       | Retry with backoff      |

### Update Cycle

```
App Start
    ↓
Initialize Service
    ↓
Fetch from OpenWeatherMap (Primary)
    ↓ (if fails)
Fetch from OpenMeteo (Backup)
    ↓ (if fails)
Use Cached Data
    ↓ (if no cache)
Use Default Fallback
    ↓
Display Data
    ↓
Wait 15 minutes
    ↓
Repeat Fetch
```

### Manual Refresh

- Click on weather panel to force refresh
- Shows loading spinner during update
- Updates last refresh timestamp

### Connection Status Indicator

| Color             | Status    | Meaning                       |
| ----------------- | --------- | ----------------------------- |
| 🟢 Green          | Connected | Data is fresh and current     |
| 🔴 Red (blinking) | Error     | API call failed, using cache  |
| ⚫ Gray           | Offline   | Initializing or no connection |

### File Locations

```
renderer/
├── services/
│   └── weatherService.ts        # API integration logic
├── components/
│   ├── WeatherPanel.tsx         # UI component
│   └── WeatherPanel.css         # Styling
└── assets/
    └── weather-icons/
        └── weatherIcons.ts      # SVG icon system
```

### Quick Configuration Changes

#### Change Location:

```typescript
// In WeatherPanel.tsx
const weatherConfig: WeatherConfig = {
  location: {
    lat: 16.4637, // Change latitude
    lon: 107.5909, // Change longitude
    city: "TP. THỪA THIÊN HUẾ", // Change city name
  },
};
```

#### Change Update Frequency:

```typescript
updateInterval: 15,  // Change to 10, 20, 30, etc. (minutes)
```

#### Change API Key:

```typescript
// In weatherService.ts
private apiEndpoints = [
  {
    name: "OpenWeatherMap",
    key: "YOUR_NEW_API_KEY_HERE",
    enabled: true,
  }
];
```

### Testing Commands

```bash
# Start development mode
npm run dev

# Build for production
npm run build

# Start production
npm start
```

### Console Debug Commands

```javascript
// In browser DevTools console

// Check current weather data
localStorage.getItem("weatherCache");

// Force refresh
document.querySelector(".weather-panel").click();

// Check service status
// (Add to WeatherPanel.tsx for debugging)
console.log(weatherService.getStatus());
```

### Performance Metrics

- Initial load: ~2-3 seconds
- API response time: ~500-1500ms
- Update frequency: 15 minutes
- Daily API calls: ~96 calls/day
- Cache duration: 2 hours
- Memory usage: ~5-10 MB

### Browser Compatibility

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

### Known Limitations

1. OpenMeteo fallback doesn't provide AQI data
2. UV index may be 0 at night (expected behavior)
3. Rain probability estimated for OpenMeteo
4. Free API tier limited to 1,000 calls/day

### Support & Resources

- OpenWeatherMap Docs: https://openweathermap.org/api
- OpenMeteo Docs: https://open-meteo.com/
- Weather Icons: Custom SVG implementation
- Issue Tracker: Check console for error logs

---

**Quick Help**: For common issues, check console for error messages starting with "WeatherService:"
