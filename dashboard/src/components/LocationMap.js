import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/**
 * LocationMap — isolated map display component.
 *
 * Current provider: Leaflet + Carto Voyager raster tiles (OpenStreetMap data).
 *   - Tiles: https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png
 *   - Attribution ("© OpenStreetMap contributors © CARTO") is REQUIRED by the
 *     OSM/Carto tile usage terms — do not remove it.
 *
 * Swapping providers (e.g. back to Google Maps JS API):
 *   Replace THIS FILE only. Keep the same props interface
 *   ({ center, zoom, markerPosition, onPick }) and LocationSelector.js works
 *   unchanged. The previous Google implementation (react-google-maps GoogleMap
 *   + draggable Marker) is in git history for LocationSelector.js.
 */

// Fix Leaflet's default marker icon in webpack/CRA builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const containerStyle = { width: "100%", height: "300px" };

export default function LocationMap({
  center,
  zoom = 15,
  markerPosition,
  onPick,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onPickRef = useRef(onPick);

  // Keep latest onPick without re-binding map listeners
  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  // Init map once
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map(containerRef.current).setView(
      [center.lat, center.lng],
      zoom
    );

    L.tileLayer(TILE_URL, {
      attribution: ATTRIBUTION,
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    const marker = L.marker([markerPosition.lat, markerPosition.lng], {
      draggable: true,
    }).addTo(map);

    map.on("click", (e) => {
      onPickRef.current?.(e.latlng.lat, e.latlng.lng);
    });

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onPickRef.current?.(pos.lat, pos.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter when coordinates change (Nominatim search / manual lat-lng inputs)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;
    const current = map.getCenter();
    if (current.lat !== center.lat || current.lng !== center.lng) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center]);

  // Move marker when position changes
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !markerPosition) return;
    const current = marker.getLatLng();
    if (current.lat !== markerPosition.lat || current.lng !== markerPosition.lng) {
      marker.setLatLng([markerPosition.lat, markerPosition.lng]);
    }
  }, [markerPosition]);

  return <div ref={containerRef} style={containerStyle} />;
}
