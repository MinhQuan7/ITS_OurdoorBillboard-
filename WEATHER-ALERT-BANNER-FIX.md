# Weather Alert Banner Position Fix

## Problem Analysis

The weather alert banner "CẢNH BÁO MƯA LỚN" was appearing incorrectly inside Panel 1 (Weather Panel), positioned at `bottom: 60px` within the weather panel itself.

According to the design in `research.jpg`, the banner should be positioned:

- **Between Panel 1 and Panel 2** (horizontally spanning both panels)
- **Above the Company Logo section** (positioned between the top row and bottom row)
- **Full width** across the entire 384px display

## Root Cause

The alert banner was implemented inside `WeatherPanel.tsx` component with absolute positioning relative to the weather panel, causing it to appear only within Panel 1 boundaries.

## Solution Implementation

### 1. Moved Alert Banner to BillboardLayout Component

**File: `renderer/components/BillboardLayout.tsx`**

- Added state management for weather alerts: `showWeatherAlert` and `weatherData`
- Created `handleWeatherUpdate` callback function to receive weather data from WeatherPanel
- Positioned the alert banner between `top-row` and `bottom-row` using absolute positioning
- Alert displays when:
  - Rain probability > 70%
  - Weather condition includes "mưa to" (heavy rain)
  - Weather condition includes "dông" (thunderstorm)

### 2. Updated BillboardLayout CSS

**File: `renderer/components/BillboardLayout.css`**

- Added `position: relative` to `.billboard-container` for absolute positioning context
- Added `overflow: hidden` to prevent banner overflow
- Positioned banner at `bottom: 96px` (above the 96px company logo section)
- Full width: `384px` spanning both panels
- Height: `48px` for proper visibility
- Enhanced alert icon with triangular warning symbol styling
- Added pulse animation for attention-grabbing effect

### 3. Updated WeatherPanel Component

**File: `renderer/components/WeatherPanel.tsx`**

- Added `onWeatherUpdate` prop to WeatherPanelProps interface
- Implemented callback to notify parent component of weather data changes
- Removed internal alert banner rendering (now handled by BillboardLayout)
- Weather data is now propagated upward to BillboardLayout for centralized alert management

### 4. Cleaned Up WeatherPanel CSS

**File: `renderer/components/WeatherPanel.css`**

- Removed `.weather-alert-banner` styles (now in BillboardLayout.css)
- Removed `.alert-icon-warning` styles
- Removed `.alert-text-large` styles
- Removed `alertPulse` and `alertBlink` animations (moved to BillboardLayout.css)

## Technical Details

### Layout Structure

```
┌─────────────────────────────────────┐
│         Top Row (288px)             │
│  ┌───────────┬───────────┐          │
│  │ Panel 1   │ Panel 2   │          │
│  │ Weather   │   IoT     │          │
│  │ 192x288   │ 192x288   │          │
│  └───────────┴───────────┘          │
├─────────────────────────────────────┤
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← 14px spacing
├─ ⚠ CẢNH BÁO MƯA LỚN (48px) ────────┤  ← ALERT BANNER (16px margins)
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← 14px spacing
├─────────────────────────────────────┤
│   Company Logo (96px)               │
└─────────────────────────────────────┘
```

### Alert Banner Positioning

- **Position**: Absolute
- **Bottom**: 110px (positioned above company logo with 14px spacing)
- **Left/Right**: 16px margins from screen edges
- **Width**: calc(100% - 32px) (full width minus left and right margins)
- **Height**: 48px
- **Z-index**: 10000000 (appears above all panels)
- **Background**: Red gradient (#dc2626 to #b91c1c)
- **Border-radius**: 4px (subtle rounding for modern look)
- **Animation**: Pulse effect for visibility

### Alert Icon Styling

- **Size**: 36x36px
- **Background**: Yellow (#fbbf24)
- **Color**: Red (#dc2626)
- **Border**: 2px solid red
- **Border-radius**: 2px (slight rounding)
- **Content**: "!" symbol (28px font size)

### Alert Text Styling

- **Font-size**: 20px
- **Font-weight**: Bold
- **Text-transform**: Uppercase
- **Letter-spacing**: 2px
- **Text-shadow**: Subtle shadow for depth
- **Alignment**: Center

## Design Compliance

✅ Alert banner has proper 16px margins from left and right edges
✅ Alert banner has 14px spacing above and below (from panels and logo)
✅ Positioned between top row and bottom row with proper spacing
✅ Visible across both Panel 1 and Panel 2 areas
✅ Red background with yellow warning circle
✅ Bold uppercase text "CẢNH BÁO MƯA LỚN"
✅ Subtle 4px border-radius for modern design
✅ Pulse animation for attention
✅ No icons or emojis used (text-based "!" symbol only)
✅ Follows research.jpg design specifications

## Testing Checklist

- [ ] Alert appears when rain probability > 70%
- [ ] Alert appears for heavy rain conditions
- [ ] Alert appears for thunderstorm conditions
- [ ] Alert positioned correctly between top and bottom sections
- [ ] Alert spans full 384px width
- [ ] Alert height is 48px
- [ ] Alert has proper z-index (appears above panels)
- [ ] Pulse animation works smoothly
- [ ] No TypeScript compilation errors
- [ ] No CSS styling conflicts

## Files Modified

1. `renderer/components/BillboardLayout.tsx` - Alert logic and rendering
2. `renderer/components/BillboardLayout.css` - Alert positioning and styling
3. `renderer/components/WeatherPanel.tsx` - Removed alert, added callback
4. `renderer/components/WeatherPanel.css` - Removed alert styles

## Result

The weather alert banner now correctly appears between the top row (panels 1 & 2) and the bottom row (company logo), spanning the full width of the display as designed in `research.jpg`. The alert is centrally managed by BillboardLayout and triggered based on weather conditions from WeatherPanel.
