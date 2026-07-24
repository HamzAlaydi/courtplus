import React, { useState, useRef } from "react";
import { Row, Col, InputNumber } from "antd";
import {
  GoogleMap,
  Marker,
  Autocomplete,
  useLoadScript,
} from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "300px" };

export default function LocationSelector({
  apiKey = "AIzaSyCyP-YultR_6jEofQEZnNRVPITqMv1Fsgo",
  initialPlaceName = "",
  initialCoordinates = null,
  initialAddress = "",
  onChange,
}) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: ["places"],
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

  const autocompleteRef = useRef(null);

  /** Reverse Geocoding */
  const reverseGeocode = async (lat, lng) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.results?.[0]?.formatted_address || "";
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

  /** Autocomplete selection handler */
  const onPlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (!place?.geometry) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    updateLocation(lat, lng, place.name);
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
      {isLoaded && (
        <Autocomplete
          onLoad={(ref) => (autocompleteRef.current = ref)}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="Search place"
            style={{
              width: "100%",
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 6,
              marginBottom: 10,
            }}
          />
        </Autocomplete>
      )}

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
