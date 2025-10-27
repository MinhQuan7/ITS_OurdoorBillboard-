# Weather System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ITS OUTDOOR BILLBOARD APPLICATION                        │
│                              (384x384 LED Screen)                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                  ┌───────────────────────────────────┐
                  │         Main Process              │
                  │         (main.js)                 │
                  └───────────────────────────────────┘
                                      │
                                      ▼
                  ┌───────────────────────────────────┐
                  │      Renderer Process             │
                  │         (App.tsx)                 │
                  └───────────────────────────────────┘
                                      │
                                      ▼
                  ┌───────────────────────────────────┐
                  │      BillboardLayout.tsx          │
                  │    ┌─────────────┬─────────────┐  │
                  │    │   Weather   │    IoT      │  │
                  │    │   Panel     │   Panel     │  │
                  │    │  (192x288)  │  (192x288)  │  │
                  │    └─────────────┴─────────────┘  │
                  │    ┌───────────────────────────┐  │
                  │    │    Company Logo Panel     │  │
                  │    │       (384x96)            │  │
                  │    └───────────────────────────┘  │
                  └───────────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                           WEATHER SYSTEM DETAILED VIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


┌─────────────────────────────────────────────────────────────────────────────┐
│                              WEATHER PANEL                                   │
│                         (WeatherPanel.tsx + CSS)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                     TP. THỪA THIÊN HUẾ                      [●]    │    │
│  │                                                            (status) │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │         ☀️              28°                                         │    │
│  │      (Weather        (Temperature)                                 │    │
│  │        Icon)          Cảm giác 32°                                 │    │
│  │                      (Feels Like)                                  │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                   Mây rải rác                                       │    │
│  │                (Weather Condition)                                 │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │  Độ ẩm 75%                           UV Cao                        │    │
│  │  Ít khả năng mưa                     Gió 12 km/h                   │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │              🟡 Không khí: Khá                                      │    │
│  │                   (AQI: 2 - Color coded)                           │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                      10:30                                          │    │
│  │                  (Last Updated)                                     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Uses
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          WEATHER SERVICE                                     │
│                       (weatherService.ts)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Configuration:                                                              │
│  ├─ Location: Huế (16.4637°N, 107.5909°E)                                  │
│  ├─ Update Interval: 2 minutes                                              │
│  ├─ Retry Interval: 5 minutes (exponential backoff)                         │
│  ├─ Max Retries: 3                                                          │
│  └─ Timeout: 15 seconds                                                     │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │                    FETCH WEATHER DATA                             │      │
│  │                                                                   │      │
│  │  Every 2 minutes:                                                 │      │
│  │  1. Try Primary API (OpenWeatherMap)                             │      │
│  │  2. If fails, try Fallback API (OpenMeteo)                       │      │
│  │  3. If fails, use Cached Data                                    │      │
│  │  4. If no cache, use Default Fallback                            │      │
│  │  5. Update UI with results                                       │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                     │
                    ▼                                     ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────┐
│      PRIMARY API SOURCE              │  │     FALLBACK API SOURCE          │
│    OpenWeatherMap v2.5               │  │       OpenMeteo v1               │
├──────────────────────────────────────┤  ├──────────────────────────────────┤
│                                      │  │                                  │
│  ✅ Enabled: YES                     │  │  ✅ Enabled: YES                 │
│  🔑 API Key: Required                │  │  🔑 API Key: Not required        │
│  🌍 Global Coverage                  │  │  🌍 Global Coverage              │
│  📊 Free Tier: 1000 calls/day       │  │  📊 Free Tier: Unlimited         │
│                                      │  │                                  │
│  Endpoints Used:                     │  │  Endpoints Used:                 │
│  ├─ /weather (Current)               │  │  ├─ /forecast (Current+Hourly)  │
│  ├─ /forecast (UV, Rain %)           │  │  └─ No AQI data                 │
│  └─ /air_pollution (AQI)             │  │                                  │
│                                      │  │                                  │
│  Data Provided:                      │  │  Data Provided:                  │
│  ✅ Temperature (°C)                 │  │  ✅ Temperature (°C)             │
│  ✅ Feels Like (°C)                  │  │  ✅ Feels Like (°C)              │
│  ✅ Humidity (%)                     │  │  ✅ Humidity (%)                 │
│  ✅ Wind Speed (m/s → km/h)          │  │  ✅ Wind Speed (km/h)            │
│  ✅ UV Index (0-11+)                 │  │  ✅ UV Index (0-11+)             │
│  ✅ Rain Probability (%)             │  │  ⚠️  Rain (estimated)            │
│  ✅ Visibility (km)                  │  │  ⚠️  Visibility (default 10km)   │
│  ✅ Weather Code & Description       │  │  ✅ Weather Code                 │
│  ✅ Air Quality Index (1-5)          │  │  ❌ AQI (uses default: 1)        │
│                                      │  │                                  │
│  API Call Sequence:                  │  │  API Call Sequence:              │
│  ┌────────────────────────────────┐ │  │  ┌──────────────────────────┐   │
│  │ 1. GET /weather                │ │  │  │ 1. GET /forecast         │   │
│  │    → Temperature, Humidity,    │ │  │  │    → All weather data    │   │
│  │      Wind, Condition           │ │  │  │      in one call         │   │
│  ├────────────────────────────────┤ │  │  └──────────────────────────┘   │
│  │ 2. GET /forecast               │ │  │                                  │
│  │    → UV Index, Rain %          │ │  │  Translation:                    │
│  ├────────────────────────────────┤ │  │  Weather codes → Vietnamese      │
│  │ 3. GET /air_pollution          │ │  │                                  │
│  │    → AQI (1-5), Pollutants     │ │  │                                  │
│  └────────────────────────────────┘ │  │                                  │
│                                      │  │                                  │
│  Response Processing:                │  │  Response Processing:            │
│  ├─ Parse JSON responses             │  │  ├─ Parse JSON response          │
│  ├─ Translate to Vietnamese          │  │  ├─ Translate weather codes      │
│  ├─ Calculate AQI text               │  │  ├─ Use default AQI = 1          │
│  ├─ Convert units (m/s to km/h)      │  │  └─ Return formatted data        │
│  └─ Return WeatherData object        │  │                                  │
│                                      │  │                                  │
└──────────────────────────────────────┘  └──────────────────────────────────┘
                    │                                     │
                    └─────────────────┬─────────────────┘
                                      ▼
                  ┌───────────────────────────────────┐
                  │       WEATHER DATA OBJECT         │
                  │     (WeatherData Interface)       │
                  ├───────────────────────────────────┤
                  │                                   │
                  │  cityName: string                 │
                  │  temperature: number (°C)         │
                  │  feelsLike: number (°C)           │
                  │  humidity: number (%)             │
                  │  windSpeed: number (km/h)         │
                  │  uvIndex: number (0-11+)          │
                  │  rainProbability: number (%)      │
                  │  weatherCondition: string (VI)    │
                  │  weatherCode: number              │
                  │  airQuality: string (VI)          │
                  │  aqi: number (1-5)                │
                  │  visibility: number (km)          │
                  │  lastUpdated: Date                │
                  │                                   │
                  └───────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                     │
                    ▼                                     ▼
        ┌───────────────────────┐           ┌───────────────────────┐
        │   WEATHER ICON        │           │   AIR QUALITY         │
        │   SYSTEM              │           │   COLOR SYSTEM        │
        ├───────────────────────┤           ├───────────────────────┤
        │                       │           │                       │
        │  weatherIcons.ts      │           │  WeatherPanel.css     │
        │                       │           │                       │
        │  Based on:            │           │  AQI → Color:         │
        │  ├─ weatherCode       │           │  ├─ 1 → 🟢 Green     │
        │  └─ condition text    │           │  ├─ 2 → 🟡 Yellow    │
        │                       │           │  ├─ 3 → 🟠 Orange    │
        │  Icons:               │           │  ├─ 4 → 🔴 Red       │
        │  ☀️ Clear/Sunny       │           │  └─ 5 → 🟣 Purple    │
        │  ⛅ Partly Cloudy     │           │                       │
        │  ☁️ Cloudy            │           │  Animations:          │
        │  🌧️ Rainy             │           │  ├─ AQI 1-2: None    │
        │  ⛈️ Thunderstorm      │           │  ├─ AQI 3: Slow pulse│
        │  ❄️ Snow              │           │  └─ AQI 4-5: Fast    │
        │  🌫️ Fog               │           │       pulse + bold   │
        │  💨 Wind              │           │                       │
        │                       │           │                       │
        │  Colors:              │           └───────────────────────┘
        │  #FFD700 (Sunny)      │
        │  #4682B4 (Rainy)      │
        │  #B0C4DE (Cloudy)     │
        │  #4B0082 (Stormy)     │
        │                       │
        └───────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              ERROR HANDLING FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


                      ┌──────────────────────┐
                      │   Fetch Weather      │
                      │   (Timer: 15 min)    │
                      └──────────┬───────────┘
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │ Try OpenWeatherMap   │◄────────┐
                      └──────────┬───────────┘         │
                                 │                      │
                    ┌────────────┴────────────┐        │
                    │                         │        │
                Success?                   Failed?     │
                    │                         │        │
                    ▼                         ▼        │
          ┌─────────────────┐    ┌────────────────────┤
          │ Parse & Store   │    │ Try OpenMeteo      │
          │ Weather Data    │    └────────┬───────────┘
          └────────┬────────┘             │
                   │           ┌──────────┴──────────┐
                   │           │                     │
                   │       Success?              Failed?
                   │           │                     │
                   │           ▼                     ▼
                   │   ┌──────────────┐   ┌─────────────────┐
                   │   │ Use OpenMeteo│   │  Retry Count++  │
                   │   │ Data (no AQI)│   └────────┬────────┘
                   │   └──────┬───────┘            │
                   │          │         ┌──────────┴─────────┐
                   │          │         │                    │
                   │          │   Count < 3?            Count >= 3?
                   │          │         │                    │
                   │          │         ▼                    ▼
                   │          │   ┌──────────┐   ┌─────────────────┐
                   │          │   │Exponential│   │  Use Cache or   │
                   │          │   │  Backoff  │   │  Fallback Data  │
                   │          │   │5→10→20 min│   └────────┬────────┘
                   │          │   └─────┬─────┘            │
                   │          │         │                  │
                   │          │         └──────────────────┘
                   │          │                  │
                   └──────────┴──────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │  Update UI          │
                   │  ├─ Display Data    │
                   │  ├─ Update Icon     │
                   │  ├─ Show Status     │
                   │  └─ Log to Console  │
                   └─────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                            DATA UPDATE TIMELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


 Time │ Event
──────┼────────────────────────────────────────────────────────────────────
 0:00 │ ▶ App Starts
      │   └─> Initialize WeatherService
      │       └─> Fetch Initial Data
      │           └─> Display in UI
      │
 0:02 │ ✅ Data Loaded (First Time)
      │   └─> Show: 28°C, Mây rải rác, AQI: Khá
      │
15:00 │ 🔄 Auto-Update #1
      │   └─> Fetch from OpenWeatherMap
      │       └─> Update UI
      │
30:00 │ 🔄 Auto-Update #2
      │   └─> Fetch from OpenWeatherMap
      │       └─> Update UI
      │
45:00 │ 🔄 Auto-Update #3
      │   └─> Fetch from OpenWeatherMap
      │       └─> Update UI
      │
60:00 │ 🔄 Auto-Update #4 (1 hour mark)
      │   └─> Fetch from OpenWeatherMap
      │       └─> Update UI
      │
 ...  │ ⟳ Continues every 15 minutes
      │
      │ 👆 Manual Refresh
      │   └─> User clicks panel
      │       └─> Force immediate update
      │           └─> Show loading spinner
      │               └─> Update data
      │


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                            COMPONENT RELATIONSHIPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


┌────────────────────────────────────────────────────────────────────────┐
│                           App.tsx (Root)                                │
│                         384x384 container                               │
└───────────────────────────────┬────────────────────────────────────────┘
                                │
                                │ renders
                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      BillboardLayout.tsx                                │
│                    3-panel grid layout                                  │
└───────────┬────────────────────┬───────────────────┬───────────────────┘
            │                    │                   │
    ┌───────▼──────┐    ┌───────▼──────┐   ┌───────▼──────┐
    │ WeatherPanel │    │   IoT Panel  │   │  Logo Panel  │
    │  (192x288)   │    │  (192x288)   │   │  (384x96)    │
    └───────┬──────┘    └──────────────┘   └──────────────┘
            │
            │ uses
            ▼
    ┌───────────────┐
    │WeatherService │
    │  (singleton)  │
    └───────┬───────┘
            │
            │ fetches from
            ▼
    ┌───────────────┐     ┌───────────────┐
    │OpenWeatherMap │     │   OpenMeteo   │
    │   (Primary)   │     │  (Fallback)   │
    └───────────────┘     └───────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              KEY METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────────────────┬─────────────────────────────────────────────────┐
│ Metric               │ Value                                           │
├──────────────────────┼─────────────────────────────────────────────────┤
│ Update Frequency     │ Every 15 minutes                                │
│ Initial Load Time    │ 2-3 seconds                                     │
│ API Response Time    │ 500-1500ms                                      │
│ Timeout Duration     │ 15 seconds                                      │
│ Retry Attempts       │ 3 times (exponential backoff)                   │
│ Cache Duration       │ 2 hours                                         │
│ Daily API Calls      │ ~96 calls/day (within free tier)                │
│ Memory Usage         │ ~5-10 MB                                        │
│ CPU Usage            │ <5% during updates                              │
│ Network Bandwidth    │ ~10 KB per API call                             │
└──────────────────────┴─────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION METRICS                                │
├──────────────────────────────────────────────────────────────────────────┤
│ Uptime Target:              99.9% (24/7 operation)                       │
│ Max Downtime:               <1 minute (auto-recovery)                    │
│ Data Freshness:             Always <30 minutes old                       │
│ Error Recovery Time:        <5 minutes (with retries)                    │
│ API Success Rate:           >99% (with fallback)                         │
└──────────────────────────────────────────────────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              TECHNOLOGY STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌────────────────────────────────────────────────────────────────────────┐
│ Layer              │ Technology                    │ Version           │
├────────────────────┼───────────────────────────────┼───────────────────┤
│ Desktop App        │ Electron                      │ 25.x              │
│ UI Framework       │ React                         │ 18.x              │
│ Type Safety        │ TypeScript                    │ 5.x               │
│ HTTP Client        │ Axios                         │ 1.x               │
│ Weather API        │ OpenWeatherMap v2.5           │ Latest            │
│ Fallback API       │ OpenMeteo v1                  │ Latest            │
│ Styling            │ CSS3 (with animations)        │ Latest            │
│ Icons              │ Custom SVG                    │ N/A               │
│ State Management   │ React Hooks                   │ Built-in          │
└────────────────────┴───────────────────────────────┴───────────────────┘
```
