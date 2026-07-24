const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const NOMINATIM_USER_AGENT = "CourtPlusApp/1.0 (contact@courtplusapp.com)";

export type GeocodedAddress = {
  lat: number;
  lng: number;
  formattedAddress: string;
  address: Record<string, string>;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
};

const nominatimFetch = async (path: string, params: Record<string, string>) => {
  const query = new URLSearchParams({
    format: "json",
    addressdetails: "1",
    limit: "5",
    ...params,
  }).toString();

  const response = await fetch(`${NOMINATIM_BASE_URL}/${path}?${query}`, {
    headers: {
      "User-Agent": NOMINATIM_USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim request failed with status ${response.status}`);
  }

  return response.json();
};

const mapResult = (result: NominatimResult): GeocodedAddress => ({
  lat: parseFloat(result.lat),
  lng: parseFloat(result.lon),
  formattedAddress: result.display_name,
  address: result.address ?? {},
});

export const geocodeAddress = async (
  query: string
): Promise<GeocodedAddress[]> => {
  const results: NominatimResult[] = await nominatimFetch("search", {
    q: query,
  });
  return results.map(mapResult);
};

export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<GeocodedAddress | null> => {
  const result = (await nominatimFetch("reverse", {
    lat: String(lat),
    lon: String(lng),
  })) as NominatimResult & { error?: string };

  if (result.error || !result.display_name) {
    return null;
  }
  return mapResult(result);
};
