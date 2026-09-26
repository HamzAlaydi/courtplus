/**
 * Time zones as people actually think about them: by city.
 *
 * The previous list was labelled with standards names — "(UTC+03:00) Arabia
 * Standard Time", "(UTC-05:00) Eastern Standard Time". A facility owner in
 * Jeddah has no reason to know that Arabia Standard Time is theirs, and
 * picking the wrong one silently shifts every booking slot on the branch.
 * Leading with cities makes the choice recognisable; the offset stays as a
 * secondary confirmation and is rendered live (so it follows DST) rather than
 * hardcoded here.
 *
 * `cities` feeds search, so typing "Mecca", "مكة" or "Riyadh" all find the
 * same zone.
 */
export const timeZones = [
  // --- Middle East (launch market first) -----------------------------------
  { value: "Asia/Riyadh", city: "Riyadh", country: "Saudi Arabia", cities: ["Riyadh", "Mecca", "Makkah", "Jeddah", "Medina", "Dammam", "Kuwait", "Bahrain", "Qatar", "Doha", "الرياض", "مكة", "جدة", "المدينة", "الدمام"] },
  { value: "Asia/Dubai", city: "Dubai", country: "UAE", cities: ["Dubai", "Abu Dhabi", "Sharjah", "Muscat", "Oman", "دبي", "أبوظبي", "الشارقة", "مسقط"] },
  { value: "Africa/Cairo", city: "Cairo", country: "Egypt", cities: ["Cairo", "Alexandria", "Giza", "القاهرة", "الإسكندرية", "الجيزة"] },
  { value: "Asia/Amman", city: "Amman", country: "Jordan", cities: ["Amman", "Irbid", "عمان", "إربد"] },
  { value: "Asia/Beirut", city: "Beirut", country: "Lebanon", cities: ["Beirut", "بيروت"] },
  { value: "Asia/Baghdad", city: "Baghdad", country: "Iraq", cities: ["Baghdad", "Basra", "Erbil", "بغداد", "البصرة", "أربيل"] },
  { value: "Asia/Hebron", city: "Gaza / Jerusalem", country: "Palestine", cities: ["Gaza", "Jerusalem", "Hebron", "Ramallah", "غزة", "القدس", "الخليل", "رام الله"] },
  { value: "Asia/Damascus", city: "Damascus", country: "Syria", cities: ["Damascus", "Aleppo", "دمشق", "حلب"] },
  { value: "Asia/Tehran", city: "Tehran", country: "Iran", cities: ["Tehran", "طهران"] },
  { value: "Europe/Istanbul", city: "Istanbul", country: "Türkiye", cities: ["Istanbul", "Ankara", "إسطنبول", "أنقرة"] },

  // --- Africa ---------------------------------------------------------------
  { value: "Africa/Casablanca", city: "Casablanca", country: "Morocco", cities: ["Casablanca", "Rabat", "Marrakesh", "الدار البيضاء", "الرباط", "مراكش"] },
  { value: "Africa/Algiers", city: "Algiers", country: "Algeria", cities: ["Algiers", "Oran", "الجزائر", "وهران"] },
  { value: "Africa/Tunis", city: "Tunis", country: "Tunisia", cities: ["Tunis", "تونس"] },
  { value: "Africa/Tripoli", city: "Tripoli", country: "Libya", cities: ["Tripoli", "Benghazi", "طرابلس", "بنغازي"] },
  { value: "Africa/Khartoum", city: "Khartoum", country: "Sudan", cities: ["Khartoum", "الخرطوم"] },
  { value: "Africa/Lagos", city: "Lagos", country: "Nigeria", cities: ["Lagos", "Abuja", "Accra", "Ghana"] },
  { value: "Africa/Nairobi", city: "Nairobi", country: "Kenya", cities: ["Nairobi", "Addis Ababa", "Ethiopia", "Kampala"] },
  { value: "Africa/Johannesburg", city: "Johannesburg", country: "South Africa", cities: ["Johannesburg", "Cape Town", "Pretoria", "Durban"] },

  // --- Europe ---------------------------------------------------------------
  { value: "Europe/London", city: "London", country: "United Kingdom", cities: ["London", "Manchester", "Dublin", "Ireland", "Edinburgh", "لندن"] },
  { value: "Europe/Lisbon", city: "Lisbon", country: "Portugal", cities: ["Lisbon", "Porto"] },
  { value: "Europe/Madrid", city: "Madrid", country: "Spain", cities: ["Madrid", "Barcelona", "Valencia", "Seville", "مدريد", "برشلونة"] },
  { value: "Europe/Paris", city: "Paris", country: "France", cities: ["Paris", "Lyon", "Marseille", "Brussels", "Amsterdam", "باريس"] },
  { value: "Europe/Berlin", city: "Berlin", country: "Germany", cities: ["Berlin", "Munich", "Frankfurt", "Hamburg", "Vienna", "Zurich", "برلين"] },
  { value: "Europe/Rome", city: "Rome", country: "Italy", cities: ["Rome", "Milan", "Naples", "روما", "ميلانو"] },
  { value: "Europe/Athens", city: "Athens", country: "Greece", cities: ["Athens", "Thessaloniki"] },
  { value: "Europe/Bucharest", city: "Bucharest", country: "Romania", cities: ["Bucharest", "Kyiv", "Ukraine", "Helsinki"] },
  { value: "Europe/Moscow", city: "Moscow", country: "Russia", cities: ["Moscow", "Saint Petersburg", "موسكو"] },

  // --- Asia -----------------------------------------------------------------
  { value: "Asia/Karachi", city: "Karachi", country: "Pakistan", cities: ["Karachi", "Lahore", "Islamabad", "Tashkent"] },
  { value: "Asia/Kolkata", city: "Mumbai / Delhi", country: "India", cities: ["Mumbai", "Delhi", "Bangalore", "Kolkata", "Chennai", "Colombo"] },
  { value: "Asia/Dhaka", city: "Dhaka", country: "Bangladesh", cities: ["Dhaka", "Almaty"] },
  { value: "Asia/Bangkok", city: "Bangkok", country: "Thailand", cities: ["Bangkok", "Hanoi", "Jakarta", "Ho Chi Minh"] },
  { value: "Asia/Singapore", city: "Singapore", country: "Singapore", cities: ["Singapore", "Kuala Lumpur", "Manila", "Hong Kong", "Beijing", "Shanghai", "Perth"] },
  { value: "Asia/Tokyo", city: "Tokyo", country: "Japan", cities: ["Tokyo", "Osaka", "Seoul", "طوكيو"] },

  // --- Oceania --------------------------------------------------------------
  { value: "Australia/Sydney", city: "Sydney", country: "Australia", cities: ["Sydney", "Melbourne", "Canberra", "Brisbane"] },
  { value: "Pacific/Auckland", city: "Auckland", country: "New Zealand", cities: ["Auckland", "Wellington"] },

  // --- Americas -------------------------------------------------------------
  { value: "America/Sao_Paulo", city: "São Paulo", country: "Brazil", cities: ["Sao Paulo", "São Paulo", "Rio de Janeiro", "Buenos Aires", "Santiago"] },
  { value: "America/New_York", city: "New York", country: "United States", cities: ["New York", "Washington", "Washington DC", "Miami", "Toronto", "Boston", "Atlanta", "نيويورك", "واشنطن"] },
  { value: "America/Chicago", city: "Chicago", country: "United States", cities: ["Chicago", "Houston", "Dallas", "Mexico City", "شيكاغو"] },
  { value: "America/Denver", city: "Denver", country: "United States", cities: ["Denver", "Phoenix", "Salt Lake City"] },
  { value: "America/Los_Angeles", city: "Los Angeles", country: "United States", cities: ["Los Angeles", "San Francisco", "Seattle", "Vancouver", "San Diego", "لوس أنجلوس"] },
  { value: "America/Anchorage", city: "Anchorage", country: "United States", cities: ["Anchorage", "Alaska"] },
  { value: "Pacific/Honolulu", city: "Honolulu", country: "United States", cities: ["Honolulu", "Hawaii"] },
];

/**
 * Live UTC offset for a zone, e.g. "UTC+03:00".
 *
 * Computed from the Intl API rather than stored, so it stays correct across
 * daylight saving changes — a hardcoded label would be wrong for half the year
 * in every DST region.
 */
export function getOffsetLabel(timeZone, at = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    }).formatToParts(at);
    const name = parts.find((p) => p.type === "timeZoneName")?.value || "";
    // Intl renders exact UTC as "GMT"; show it in the same shape as the rest.
    return name.replace("GMT", "UTC") || "UTC+00:00";
  } catch {
    return "";
  }
}

/** Current wall-clock time in a zone, e.g. "14:35". */
export function getCurrentTime(timeZone, at = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(at);
  } catch {
    return "";
  }
}

/** The visitor's own zone, if we have an entry for it. */
export function detectTimeZone() {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timeZones.some((tz) => tz.value === detected) ? detected : null;
  } catch {
    return null;
  }
}

/** Everything a row needs to be searchable, as one lowercase haystack. */
export function searchTextFor(tz) {
  return [tz.city, tz.country, tz.value.replace(/[_/]/g, " "), ...(tz.cities || [])]
    .join(" ")
    .toLowerCase();
}
