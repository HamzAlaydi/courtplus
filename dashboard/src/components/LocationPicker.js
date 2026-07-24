import React, { useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

// Set default map settings
const containerStyle = {
  width: "100%",
  height: "400px",
};

// Default center position
const defaultCenter = {
  lat: 37.7749, // Default latitude (San Francisco)
  lng: -122.4194, // Default longitude
};

const LocationPicker = ({ apiKey, onLocationSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState(defaultCenter);

  const handleMarkerDrag = (event) => {
    const newLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    setSelectedLocation(newLocation);
    onLocationSelect && onLocationSelect(newLocation);
  };

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={selectedLocation}
        zoom={12}
      >
        {/* Draggable marker */}
        <Marker
          position={selectedLocation}
          draggable
          onDragEnd={handleMarkerDrag}
        />
      </GoogleMap>

      {/* Display selected coordinates */}
      <div style={{ marginTop: "10px", fontSize: "14px" }}>
        <strong>Selected Location:</strong> {selectedLocation.lat.toFixed(6)},{" "}
        {selectedLocation.lng.toFixed(6)}
      </div>
    </LoadScript>
  );
};

export default LocationPicker;
