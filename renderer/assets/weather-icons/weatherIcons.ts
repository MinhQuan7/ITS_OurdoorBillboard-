// weatherIcons.ts - Weather icon system with SVG icons (no emojis)
// Professional weather icons for outdoor billboard display

export const WeatherIcons = {
  // Clear sky / Sunny - Enhanced design
  CLEAR_DAY: `<svg viewBox="0 0 64 64" fill="currentColor">
    <circle cx="32" cy="32" r="10" fill="#FFD700" stroke="#FFA500" stroke-width="2"/>
    <g stroke="#FFD700" stroke-width="3" stroke-linecap="round">
      <line x1="32" y1="8" x2="32" y2="16"/>
      <line x1="32" y1="48" x2="32" y2="56"/>
      <line x1="13.86" y1="13.86" x2="19.44" y2="19.44"/>
      <line x1="44.56" y1="44.56" x2="50.14" y2="50.14"/>
      <line x1="8" y1="32" x2="16" y2="32"/>
      <line x1="48" y1="32" x2="56" y2="32"/>
      <line x1="13.86" y1="50.14" x2="19.44" y2="44.56"/>
      <line x1="44.56" y1="19.44" x2="50.14" y2="13.86"/>
    </g>
  </svg>`,

  // Partly cloudy - Enhanced with better cloud design
  PARTLY_CLOUDY: `<svg viewBox="0 0 64 64" fill="currentColor">
    <circle cx="20" cy="20" r="6" fill="#FFD700" stroke="#FFA500" stroke-width="2"/>
    <g stroke="#FFD700" stroke-width="2" stroke-linecap="round">
      <line x1="20" y1="8" x2="20" y2="12"/>
      <line x1="20" y1="28" x2="20" y2="32"/>
      <line x1="8" y1="20" x2="12" y2="20"/>
      <line x1="28" y1="20" x2="32" y2="20"/>
    </g>
    <path d="M44 28c4 0 8 3 8 7s-4 7-8 7H20c-5 0-9-4-9-9s4-9 9-9c1 0 2 0 3 1 2-6 8-10 15-10 8 0 15 6 15 14v-1z" fill="#B0C4DE" stroke="#87CEEB" stroke-width="1"/>
  </svg>`,

  // Cloudy - Better cloud design
  CLOUDY: `<svg viewBox="0 0 64 64" fill="currentColor">
    <path d="M48 35c3 0 6 2 6 5s-3 5-6 5H18c-4 0-8-3-8-8s4-8 8-8c1 0 2 0 3 1 2-5 7-9 13-9 7 0 13 5 13 12 0-1 0-1 1-1 2-2 5-3 8-3z" fill="#B0C4DE" stroke="#87CEEB" stroke-width="2"/>
    <path d="M40 25c2 0 4 1 4 3s-2 3-4 3H22c-3 0-5-2-5-5s2-5 5-5c0 0 1 0 2 0 1-3 4-6 8-6 4 0 8 3 8 8 0 0 0 0 1 0 1-1 3-2 5-2z" fill="#D3D3D3" stroke="#C0C0C0" stroke-width="1"/>
  </svg>`,

  // Rainy - Enhanced with better raindrops
  RAINY: `<svg viewBox="0 0 64 64" fill="currentColor">
    <path d="M48 30c3 0 6 2 6 5s-3 5-6 5H18c-4 0-8-3-8-8s4-8 8-8c1 0 2 0 3 1 2-5 7-9 13-9 7 0 13 5 13 12z" fill="#87CEEB" stroke="#4682B4" stroke-width="2"/>
    <g stroke="#4682B4" stroke-width="2" stroke-linecap="round">
      <line x1="18" y1="44" x2="20" y2="52"/>
      <line x1="26" y1="42" x2="28" y2="50"/>
      <line x1="34" y1="44" x2="36" y2="52"/>
      <line x1="42" y1="42" x2="44" y2="50"/>
      <line x1="22" y1="50" x2="24" y2="58"/>
      <line x1="30" y1="48" x2="32" y2="56"/>
      <line x1="38" y1="50" x2="40" y2="58"/>
    </g>
  </svg>`,

  // Heavy rain - Enhanced with heavy raindrops
  HEAVY_RAIN: `<svg viewBox="0 0 64 64" fill="currentColor">
    <path d="M48 30c3 0 6 2 6 5s-3 5-6 5H18c-4 0-8-3-8-8s4-8 8-8c1 0 2 0 3 1 2-5 7-9 13-9 7 0 13 5 13 12z" fill="#4682B4" stroke="#2F4F4F" stroke-width="2"/>
    <g stroke="#2F4F4F" stroke-width="3" stroke-linecap="round">
      <line x1="16" y1="42" x2="18" y2="54"/>
      <line x1="22" y1="44" x2="24" y2="56"/>
      <line x1="28" y1="42" x2="30" y2="54"/>
      <line x1="34" y1="44" x2="36" y2="56"/>
      <line x1="40" y1="42" x2="42" y2="54"/>
      <line x1="46" y1="44" x2="48" y2="56"/>
      <line x1="19" y1="48" x2="21" y2="60"/>
      <line x1="25" y1="50" x2="27" y2="62"/>
      <line x1="31" y1="48" x2="33" y2="60"/>
      <line x1="37" y1="50" x2="39" y2="62"/>
      <line x1="43" y1="48" x2="45" y2="60"/>
    </g>
  </svg>`,

  // Thunderstorm - Enhanced with lightning
  THUNDERSTORM: `<svg viewBox="0 0 64 64" fill="currentColor">
    <path d="M48 30c3 0 6 2 6 5s-3 5-6 5H18c-4 0-8-3-8-8s4-8 8-8c1 0 2 0 3 1 2-5 7-9 13-9 7 0 13 5 13 12z" fill="#2F4F4F" stroke="#191970" stroke-width="2"/>
    <g stroke="#4682B4" stroke-width="2" stroke-linecap="round">
      <line x1="20" y1="44" x2="22" y2="52"/>
      <line x1="42" y1="42" x2="44" y2="50"/>
    </g>
    <path d="M32 40l-4 12 8-6-4-2 4-12-8 6 4 2z" fill="#FFD700" stroke="#FFA500" stroke-width="1"/>
  </svg>`,

  // Snow - Enhanced snowflakes
  SNOW: `<svg viewBox="0 0 64 64" fill="currentColor">
    <path d="M48 30c3 0 6 2 6 5s-3 5-6 5H18c-4 0-8-3-8-8s4-8 8-8c1 0 2 0 3 1 2-5 7-9 13-9 7 0 13 5 13 12z" fill="#E6F3FF" stroke="#B0E0E6" stroke-width="2"/>
    <g fill="#FFFFFF" stroke="#B0E0E6" stroke-width="1">
      <circle cx="18" cy="45" r="2"/>
      <circle cx="26" cy="48" r="2"/>
      <circle cx="34" cy="45" r="2"/>
      <circle cx="42" cy="48" r="2"/>
      <circle cx="22" cy="52" r="1.5"/>
      <circle cx="30" cy="55" r="1.5"/>
      <circle cx="38" cy="52" r="1.5"/>
    </g>
  </svg>`,

  // Fog/Mist - Enhanced with layered lines
  FOG: `<svg viewBox="0 0 64 64" fill="currentColor">
    <g stroke="#D3D3D3" stroke-width="3" stroke-linecap="round" opacity="0.8">
      <line x1="8" y1="20" x2="56" y2="20"/>
      <line x1="12" y1="26" x2="52" y2="26"/>
      <line x1="8" y1="32" x2="56" y2="32"/>
      <line x1="16" y1="38" x2="48" y2="38"/>
      <line x1="8" y1="44" x2="56" y2="44"/>
    </g>
  </svg>`,

  // Wind - Enhanced wind lines
  WIND: `<svg viewBox="0 0 64 64" fill="currentColor">
    <g stroke="#87CEEB" stroke-width="3" stroke-linecap="round">
      <path d="M8 20 Q 24 16, 40 20 Q 48 22, 56 18"/>
      <path d="M8 28 Q 20 24, 36 28 Q 44 30, 52 26"/>
      <path d="M8 36 Q 28 32, 44 36 Q 52 38, 60 34"/>
      <path d="M8 44 Q 16 40, 32 44 Q 40 46, 48 42"/>
    </g>
  </svg>`,

  // Default/Unknown - Enhanced question mark design
  DEFAULT: `<svg viewBox="0 0 64 64" fill="currentColor">
    <circle cx="32" cy="32" r="28" fill="#B0C4DE" stroke="#87CEEB" stroke-width="3"/>
    <text x="32" y="42" text-anchor="middle" font-size="32" font-weight="bold" fill="#FFFFFF">?</text>
  </svg>`,
};

/**
 * Get weather icon based on weather code and condition
 */
export function getWeatherIcon(weatherCode: number, condition: string): string {
  // Clear sky conditions
  if (
    weatherCode === 0 ||
    weatherCode === 1 ||
    condition.includes("quang") ||
    condition.includes("nắng")
  ) {
    return WeatherIcons.CLEAR_DAY;
  }

  // Partly cloudy
  if (
    weatherCode === 2 ||
    weatherCode === 3 ||
    condition.includes("mây") ||
    condition.includes("u ám")
  ) {
    return WeatherIcons.PARTLY_CLOUDY;
  }

  // Cloudy
  if (condition.includes("âm u") || condition.includes("nhiều mây")) {
    return WeatherIcons.CLOUDY;
  }

  // Rain conditions
  if ((weatherCode >= 61 && weatherCode <= 65) || condition.includes("mưa")) {
    if (condition.includes("to") || weatherCode === 65) {
      return WeatherIcons.HEAVY_RAIN;
    }
    return WeatherIcons.RAINY;
  }

  // Drizzle
  if ((weatherCode >= 51 && weatherCode <= 55) || condition.includes("phùn")) {
    return WeatherIcons.RAINY;
  }

  // Thunderstorm
  if ((weatherCode >= 95 && weatherCode <= 99) || condition.includes("dông")) {
    return WeatherIcons.THUNDERSTORM;
  }

  // Snow
  if ((weatherCode >= 71 && weatherCode <= 75) || condition.includes("tuyết")) {
    return WeatherIcons.SNOW;
  }

  // Fog/Mist
  if (weatherCode === 45 || weatherCode === 48 || condition.includes("sương")) {
    return WeatherIcons.FOG;
  }

  // Wind
  if (condition.includes("gió")) {
    return WeatherIcons.WIND;
  }

  // Default
  return WeatherIcons.DEFAULT;
}

/**
 * Get weather icon color based on condition
 */
export function getWeatherIconColor(
  weatherCode: number,
  condition: string
): string {
  // Clear/Sunny - Yellow/Orange
  if (
    weatherCode === 0 ||
    weatherCode === 1 ||
    condition.includes("quang") ||
    condition.includes("nắng")
  ) {
    return "#FFD700";
  }

  // Cloudy - Gray
  if ((weatherCode >= 2 && weatherCode <= 3) || condition.includes("mây")) {
    return "#B0C4DE";
  }

  // Rain - Blue
  if (
    (weatherCode >= 51 && weatherCode <= 65) ||
    condition.includes("mưa") ||
    condition.includes("phùn")
  ) {
    return "#4682B4";
  }

  // Thunderstorm - Dark blue/purple
  if ((weatherCode >= 95 && weatherCode <= 99) || condition.includes("dông")) {
    return "#4B0082";
  }

  // Snow - Light blue/white
  if ((weatherCode >= 71 && weatherCode <= 75) || condition.includes("tuyết")) {
    return "#E6F3FF";
  }

  // Fog - Light gray
  if (weatherCode === 45 || weatherCode === 48 || condition.includes("sương")) {
    return "#D3D3D3";
  }

  // Default - White
  return "#FFFFFF";
}
