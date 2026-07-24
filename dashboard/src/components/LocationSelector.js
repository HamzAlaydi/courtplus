import React, { useState, useEffect } from "react";
import { Row, Col, InputNumber, AutoComplete } from "antd";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "300px" };

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q=";

export default function LocationSelector({
  apiKey = "AIzaSyBA82Tqljmxcixjt3dkrSMxYWHCF8Vxt9E",
  initialPlaceName = "",
  initialCoordinates = null,
  initialAddress = "",
  onChange,
}) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: apiKey,
  });

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
  const handleMapPick = (e) => {
    updateLocation(e.latLng.lat(), e.latLng.lng(), "");
  };

  return (
    <div>
      <label>Place Name</label>
      <AutoComplete
        value={placeName}
        options={searchOptions}
        onChange={setPlaceName}
        onSelect={onPlaceSelected}
        placeholder="Search place"
        style={{ width: "100%", marginBottom: 10 }}
        filterOption={false}
      />

      <Row gutter={12} style={{ marginBottom: 10 }}>
        <Col span={12}>
          <label>Latitude</label>
          <InputNumber
            style={{ width: "100%" }}
            value={coordinates.lat}
            onChange={updateLat}
            step={0.000001}
          />
        </Col>
        <Col span={12}>
          <label>Longitude</label>
          <InputNumber
            style={{ width: "100%" }}
            value={coordinates.lng}
            onChange={updateLng}
            step={0.000001}
          />
        </Col>
      </Row>

      {isLoaded && (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={coordinates}
          zoom={15}
          onClick={handleMapPick}
        >
          <Marker position={coordinates} draggable onDragEnd={handleMapPick} />
        </GoogleMap>
      )}

      <div style={{ marginTop: 10 }}>
        <label>Address</label>
        <div
          style={{
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 6,
            background: "#fafafa",
          }}
        >
          {address || "No address available"}
        </div>
      </div>
    </div>
  );
}
