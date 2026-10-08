import React, { useState, useEffect } from "react";
import { Row, Col, InputNumber, AutoComplete } from "antd";
import LocationMap from "./LocationMap";

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q=";

export default function LocationSelector({
  initialPlaceName = "",
  initialCoordinates = null,
  initialAddress = "",
  onChange,
}) {
  // Convert backend GeoJSON if needed
  const parseGeo = (coords) => {
    if (!coords) return { lat: 25.276987, lng: 55.296249 };

    if (coords?.coordinates) {
      return {
        lat: coords.coordinates[1],
        lng: coords.coordinates[0],
      };
    }
    return coords;
  };

  const [placeName, setPlaceName] = useState(initialPlaceName || "");
  const [address, setAddress] = useState(initialAddress || "");
  const [coordinates, setCoordinates] = useState(parseGeo(initialCoordinates));
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  // Edit pages mount this before the branch/court has loaded: without this
  // the map stayed on the default location once the real one arrived.
  useEffect(() => {
    setPlaceName(initialPlaceName || "");
    setAddress(initialAddress || "");
    setCoordinates(parseGeo(initialCoordinates));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPlaceName, initialAddress, JSON.stringify(initialCoordinates)]);

  /** Debounced Nominatim search (OpenStreetMap, no API key needed) */
  useEffect(() => {
    const query = placeName.trim();
    if (query.length < 3) {
      setSearchOptions([]);
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(NOMINATIM_URL + encodeURIComponent(query));
        const data = await res.json();
        setSearchResults(data);
        setSearchOptions(
          data.map((place) => ({
            key: String(place.place_id),
            value: place.display_name,
            label: place.display_name,
          }))
        );
      } catch {
        setSearchOptions([]);
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [placeName]);

  /** Reverse Geocoding (Nominatim, no API key needed) */
  const reverseGeocode = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
      const res = await fetch(url);
      const data = await res.json();
      return data.display_name || "";
    } catch {
      return "";
    }
  };

  /** Update and notify parent */
  const updateLocation = async (lat, lng, name = placeName) => {
    const addr = await reverseGeocode(lat, lng);

    setCoordinates({ lat, lng });
    setAddress(addr);
    setPlaceName(name);

    onChange({
      coordinates: { lat, lng },
      address: addr,
      name,
    });
  };

  /** Autocomplete selection handler (Nominatim) */
  const onPlaceSelected = (value) => {
    const place = searchResults.find((p) => p.display_name === value);
    if (!place) return;

    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);

    updateLocation(lat, lng, place.name || place.display_name);
  };

  // Lat/Lng manual input
  const updateLat = (value) =>
    updateLocation(Number(value), coordinates.lng, "");
  const updateLng = (value) =>
    updateLocation(coordinates.lat, Number(value), "");

  // Map select
  const handleMapPick = (lat, lng) => {
    updateLocation(lat, lng, "");
  };

  return (
    <div className="location-selector">
      <div className="location-selector__field">
        <label className="location-selector__label">Place Name</label>
        <AutoComplete
          value={placeName}
          options={searchOptions}
          onChange={setPlaceName}
          onSelect={onPlaceSelected}
          placeholder="Search place"
          style={{ width: "100%" }}
          filterOption={false}
        />
      </div>

      <Row gutter={12}>
        <Col span={12}>
          <div className="location-selector__field">
            <label className="location-selector__label">Latitude</label>
            <InputNumber
              style={{ width: "100%" }}
              value={coordinates.lat}
              onChange={updateLat}
              step={0.000001}
            />
          </div>
        </Col>
        <Col span={12}>
          <div className="location-selector__field">
            <label className="location-selector__label">Longitude</label>
            <InputNumber
              style={{ width: "100%" }}
              value={coordinates.lng}
              onChange={updateLng}
              step={0.000001}
            />
          </div>
        </Col>
      </Row>

      <LocationMap
        center={coordinates}
        zoom={15}
        markerPosition={coordinates}
        onPick={handleMapPick}
      />

      <div className="location-selector__field">
        <label className="location-selector__label">Address</label>
        <div
          className={`location-selector__address${address ? "" : " is-empty"}`}
        >
          {address || "No address available"}
        </div>
      </div>
    </div>
  );
}
