import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PrayerTimeItem {
  key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  en: string;
  ar: string;
  hour: number;
  minute: number;
  timeString: string; // e.g. "04:52"
  duration: number;
  icon: string;
  color: string;
}

export interface LocationConfig {
  country: string;
  city: string;
  lat: number;
  lng: number;
  method: number; // 5 = Egyptian General Authority of Survey, 4 = Umm Al-Qura, 3 = MWL
  timezone: string;
}

// Pre-mapped country & timezone coordinates
const LOCATION_PRESETS: Record<string, LocationConfig> = {
  // Egypt (Method 5: Egyptian General Authority of Survey)
  'EG': { country: 'Egypt', city: 'Cairo', lat: 30.0444, lng: 31.2357, method: 5, timezone: 'Africa/Cairo' },
  'Africa/Cairo': { country: 'Egypt', city: 'Cairo', lat: 30.0444, lng: 31.2357, method: 5, timezone: 'Africa/Cairo' },

  // Saudi Arabia (Method 4: Umm Al-Qura University, Makkah)
  'SA': { country: 'Saudi Arabia', city: 'Riyadh', lat: 24.7136, lng: 46.6753, method: 4, timezone: 'Asia/Riyadh' },
  'Asia/Riyadh': { country: 'Saudi Arabia', city: 'Riyadh', lat: 24.7136, lng: 46.6753, method: 4, timezone: 'Asia/Riyadh' },

  // UAE (Method 8: Gulf Region / Dubai)
  'AE': { country: 'United Arab Emirates', city: 'Dubai', lat: 25.2048, lng: 55.2708, method: 8, timezone: 'Asia/Dubai' },
  'Asia/Dubai': { country: 'United Arab Emirates', city: 'Dubai', lat: 25.2048, lng: 55.2708, method: 8, timezone: 'Asia/Dubai' },

  // Kuwait
  'KW': { country: 'Kuwait', city: 'Kuwait City', lat: 29.3759, lng: 47.9774, method: 9, timezone: 'Asia/Kuwait' },
  'Asia/Kuwait': { country: 'Kuwait', city: 'Kuwait City', lat: 29.3759, lng: 47.9774, method: 9, timezone: 'Asia/Kuwait' },

  // Qatar
  'QA': { country: 'Qatar', city: 'Doha', lat: 25.2854, lng: 51.5310, method: 10, timezone: 'Asia/Qatar' },
  'Asia/Qatar': { country: 'Qatar', city: 'Doha', lat: 25.2854, lng: 51.5310, method: 10, timezone: 'Asia/Qatar' },

  // Jordan
  'JO': { country: 'Jordan', city: 'Amman', lat: 31.9454, lng: 35.9284, method: 3, timezone: 'Asia/Amman' },
  'Asia/Amman': { country: 'Jordan', city: 'Amman', lat: 31.9454, lng: 35.9284, method: 3, timezone: 'Asia/Amman' },

  // Morocco
  'MA': { country: 'Morocco', city: 'Casablanca', lat: 33.5731, lng: -7.5898, method: 3, timezone: 'Africa/Casablanca' },
  'Africa/Casablanca': { country: 'Morocco', city: 'Casablanca', lat: 33.5731, lng: -7.5898, method: 3, timezone: 'Africa/Casablanca' },

  // Algeria
  'DZ': { country: 'Algeria', city: 'Algiers', lat: 36.7538, lng: 3.0588, method: 3, timezone: 'Africa/Algiers' },
  'Africa/Algiers': { country: 'Algeria', city: 'Algiers', lat: 36.7538, lng: 3.0588, method: 3, timezone: 'Africa/Algiers' },

  // Tunisia
  'TN': { country: 'Tunisia', city: 'Tunis', lat: 36.8065, lng: 10.1815, method: 3, timezone: 'Africa/Tunis' },
  'Africa/Tunis': { country: 'Tunisia', city: 'Tunis', lat: 36.8065, lng: 10.1815, method: 3, timezone: 'Africa/Tunis' },

  // Palestine
  'PS': { country: 'Palestine', city: 'Jerusalem', lat: 31.7683, lng: 35.2137, method: 3, timezone: 'Asia/Jerusalem' },
  'Asia/Jerusalem': { country: 'Palestine', city: 'Jerusalem', lat: 31.7683, lng: 35.2137, method: 3, timezone: 'Asia/Jerusalem' },
  'Asia/Gaza': { country: 'Palestine', city: 'Gaza', lat: 31.5017, lng: 34.4668, method: 3, timezone: 'Asia/Gaza' },

  // Iraq
  'IQ': { country: 'Iraq', city: 'Baghdad', lat: 33.3152, lng: 44.3661, method: 3, timezone: 'Asia/Baghdad' },
  'Asia/Baghdad': { country: 'Iraq', city: 'Baghdad', lat: 33.3152, lng: 44.3661, method: 3, timezone: 'Asia/Baghdad' },

  // Sudan
  'SD': { country: 'Sudan', city: 'Khartoum', lat: 15.5007, lng: 32.5599, method: 5, timezone: 'Africa/Khartoum' },
  'Africa/Khartoum': { country: 'Sudan', city: 'Khartoum', lat: 15.5007, lng: 32.5599, method: 5, timezone: 'Africa/Khartoum' },

  // Turkey
  'TR': { country: 'Turkey', city: 'Istanbul', lat: 41.0082, lng: 28.9784, method: 13, timezone: 'Europe/Istanbul' },
  'Europe/Istanbul': { country: 'Turkey', city: 'Istanbul', lat: 41.0082, lng: 28.9784, method: 13, timezone: 'Europe/Istanbul' },

  // UK
  'GB': { country: 'United Kingdom', city: 'London', lat: 51.5074, lng: -0.1278, method: 3, timezone: 'Europe/London' },
  'Europe/London': { country: 'United Kingdom', city: 'London', lat: 51.5074, lng: -0.1278, method: 3, timezone: 'Europe/London' },

  // USA
  'US': { country: 'United States', city: 'New York', lat: 40.7128, lng: -74.0060, method: 2, timezone: 'America/New_York' },
  'America/New_York': { country: 'United States', city: 'New York', lat: 40.7128, lng: -74.0060, method: 2, timezone: 'America/New_York' },
};

export function getUserLocationConfig(): LocationConfig {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo';
    if (LOCATION_PRESETS[tz]) {
      return LOCATION_PRESETS[tz];
    }

    const locales = Localization.getLocales();
    const region = locales?.[0]?.regionCode?.toUpperCase();
    if (region && LOCATION_PRESETS[region]) {
      return LOCATION_PRESETS[region];
    }
  } catch (e) {
    console.warn('Error detecting location config:', e);
  }

  // Default to Egypt (Cairo)
  return LOCATION_PRESETS['EG'];
}

// Astronomical calculation helper functions (degrees to radians, etc.)
const d2r = (d: number) => (d * Math.PI) / 180.0;
const r2d = (r: number) => (r * 180.0) / Math.PI;
const sin = (d: number) => Math.sin(d2r(d));
const cos = (d: number) => Math.cos(d2r(d));
const tan = (d: number) => Math.tan(d2r(d));
const asin = (x: number) => r2d(Math.asin(x));
const acos = (x: number) => r2d(Math.acos(x));
const atan2 = (y: number, x: number) => r2d(Math.atan2(y, x));
const fixHour = (a: number) => {
  a = a - 24.0 * Math.floor(a / 24.0);
  return a < 0 ? a + 24.0 : a;
};

// Calculate astronomical prayer times locally
export function calculateLocalPrayerTimes(
  year: number,
  month: number, // 0..11
  day: number,
  config?: LocationConfig
): PrayerTimeItem[] {
  const loc = config || getUserLocationConfig();

  // Julian Date calculation
  const m = month + 1;
  let y = year;
  let mm = m;
  if (mm <= 2) {
    y -= 1;
    mm += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (mm + 1)) + day + B - 1524.5;
  const D = JD - 2451545.0;

  // Sun coordinates
  const g = 357.529 + 0.98560028 * D;
  const q = 280.459 + 0.98564736 * D;
  const L = q + 1.915 * sin(g) + 0.02 * sin(2 * g);
  const e = 23.439 - 0.00000036 * D;
  const RA = atan2(cos(e) * sin(L), cos(L)) / 15.0;
  const Dec = asin(sin(e) * sin(L));
  const EqT = q / 15.0 - RA;

  // Determine actual timezone offset for the given date (accounts for daylight saving automatically)
  const targetDate = new Date(year, month, day, 12, 0, 0);
  const tzOffsetHours = -targetDate.getTimezoneOffset() / 60;

  // Dhuhr (solar noon)
  const dhuhr = fixHour(12 + tzOffsetHours - loc.lng / 15.0 - EqT);

  // Method angles
  let fajrAngle = 19.5; // Egypt default: 19.5°
  let ishaAngle = 17.5; // Egypt default: 17.5°

  if (loc.method === 4) {
    // Umm Al-Qura
    fajrAngle = 18.5;
  } else if (loc.method === 3) {
    // Muslim World League
    fajrAngle = 18.0;
    ishaAngle = 17.0;
  } else if (loc.method === 2) {
    // ISNA
    fajrAngle = 15.0;
    ishaAngle = 15.0;
  }

  // Sun hour angle helper
  const hourAngle = (angle: number) => {
    const val = (-sin(angle) - sin(loc.lat) * sin(Dec)) / (cos(loc.lat) * cos(Dec));
    if (val < -1 || val > 1) return 0;
    return acos(val) / 15.0;
  };

  // Asr hour angle (Standard: Shafi'i/Maliki/Hanbali)
  const asrAngle = -r2d(Math.atan(1.0 / (1 + tan(Math.abs(loc.lat - Dec)))));
  const asrHA = hourAngle(-asrAngle);

  const fajrHA = hourAngle(fajrAngle);
  const sunsetHA = hourAngle(0.8333); // standard atmospheric refraction for sunrise/sunset

  const fajr = fixHour(dhuhr - fajrHA);
  const asr = fixHour(dhuhr + asrHA);
  const maghrib = fixHour(dhuhr + sunsetHA);

  let isha = 0;
  if (loc.method === 4) {
    // Umm al-Qura: 90 minutes after Maghrib
    isha = fixHour(maghrib + 1.5);
  } else {
    const ishaHA = hourAngle(ishaAngle);
    isha = fixHour(dhuhr + ishaHA);
  }

  const toHoursMinutes = (decimalHours: number) => {
    const totalMinutes = Math.round(decimalHours * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const min = totalMinutes % 60;
    return {
      hour: h,
      minute: min,
      timeString: `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
    };
  };

  const fObj = toHoursMinutes(fajr);
  const dObj = toHoursMinutes(dhuhr);
  const aObj = toHoursMinutes(asr);
  const mObj = toHoursMinutes(maghrib);
  const iObj = toHoursMinutes(isha);

  return [
    { key: 'fajr', en: 'Fajr', ar: 'الفجر', ...fObj, duration: 25, icon: 'weather-sunset-up', color: '#818CF8' },
    { key: 'dhuhr', en: 'Dhuhr', ar: 'الظهر', ...dObj, duration: 30, icon: 'weather-sunny', color: '#F59E0B' },
    { key: 'asr', en: 'Asr', ar: 'العصر', ...aObj, duration: 30, icon: 'weather-partly-cloudy', color: '#10B981' },
    { key: 'maghrib', en: 'Maghrib', ar: 'المغرب', ...mObj, duration: 25, icon: 'weather-sunset-down', color: '#EC4899' },
    { key: 'isha', en: 'Isha', ar: 'العشاء', ...iObj, duration: 30, icon: 'weather-night', color: '#8B5CF6' },
  ];
}

// Fetch from Aladhan API with automatic cache and local fallback
export async function getDynamicPrayerTimes(
  year: number,
  month: number, // 0..11
  day: number
): Promise<PrayerTimeItem[]> {
  const loc = getUserLocationConfig();
  const cacheKey = `prayer_times_${loc.country}_${loc.city}_${year}_${month + 1}_${day}`;

  try {
    // 1. Check local cache
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length === 5) {
        return parsed;
      }
    }
  } catch (cacheErr) {
    // Ignore cache read error and continue
  }

  // 2. Try fetching from official Aladhan API
  try {
    const formattedDay = day.toString().padStart(2, '0');
    const formattedMonth = (month + 1).toString().padStart(2, '0');
    const url = `https://api.aladhan.com/v1/timings/${formattedDay}-${formattedMonth}-${year}?latitude=${loc.lat}&longitude=${loc.lng}&method=${loc.method}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      const timings = json?.data?.timings;

      if (timings?.Fajr && timings?.Dhuhr && timings?.Asr && timings?.Maghrib && timings?.Isha) {
        const parseApiTime = (timeStr: string) => {
          const clean = timeStr.split(' ')[0]; // remove "(EEST)" etc.
          const [hStr, mStr] = clean.split(':');
          const h = parseInt(hStr, 10);
          const m = parseInt(mStr, 10);
          return {
            hour: isNaN(h) ? 0 : h,
            minute: isNaN(m) ? 0 : m,
            timeString: `${(isNaN(h) ? 0 : h).toString().padStart(2, '0')}:${(isNaN(m) ? 0 : m).toString().padStart(2, '0')}`,
          };
        };

        const result: PrayerTimeItem[] = [
          { key: 'fajr', en: 'Fajr', ar: 'الفجر', ...parseApiTime(timings.Fajr), duration: 25, icon: 'weather-sunset-up', color: '#818CF8' },
          { key: 'dhuhr', en: 'Dhuhr', ar: 'الظهر', ...parseApiTime(timings.Dhuhr), duration: 30, icon: 'weather-sunny', color: '#F59E0B' },
          { key: 'asr', en: 'Asr', ar: 'العصر', ...parseApiTime(timings.Asr), duration: 30, icon: 'weather-partly-cloudy', color: '#10B981' },
          { key: 'maghrib', en: 'Maghrib', ar: 'المغرب', ...parseApiTime(timings.Maghrib), duration: 25, icon: 'weather-sunset-down', color: '#EC4899' },
          { key: 'isha', en: 'Isha', ar: 'العشاء', ...parseApiTime(timings.Isha), duration: 30, icon: 'weather-night', color: '#8B5CF6' },
        ];

        // Save to cache asynchronously
        AsyncStorage.setItem(cacheKey, JSON.stringify(result)).catch(() => {});
        return result;
      }
    }
  } catch (apiErr) {
    console.log('Aladhan API unavailable, using local astronomical calculation:', apiErr);
  }

  // 3. Fallback to precise local astronomical calculation
  const calculated = calculateLocalPrayerTimes(year, month, day, loc);
  AsyncStorage.setItem(cacheKey, JSON.stringify(calculated)).catch(() => {});
  return calculated;
}
