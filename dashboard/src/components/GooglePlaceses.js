import React, { useState, useEffect } from "react";
import { AutoComplete } from "antd";

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q=";

const GooglePlacesInput = ({
  apiKey,
  initialName,
  initialPlaceId,
  onPlaceSelect,
}) => {
  const [, setPlaceId] = useState(initialPlaceId || "");
  const [inputValue, setInputValue] = useState(initialName || "");
  const [options, setOptions] = useState([]);
  const [places, setPlaces] = useState([]);

  // ✅ Update input when initial values change
  useEffect(() => {
    if (initialName) setInputValue(initialName);
    if (initialPlaceId) setPlaceId(initialPlaceId);
  }, [initialName, initialPlaceId]);

  // ✅ Debounced Nominatim search (OpenStreetMap, no API key needed)
  useEffect(() => {
    const query = inputValue.trim();
    if (query.length < 3) {
      setOptions([]);
      setPlaces([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(NOMINATIM_URL + encodeURIComponent(query));
        const data = await res.json();
        setPlaces(data);
        setOptions(
          data.map((place) => ({
            key: String(place.place_id),
            value: place.display_name,
            label: place.display_name,
          }))
        );
      } catch {
        setOptions([]);
        setPlaces([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleSelect = (value) => {
    const place = places.find((p) => p.display_name === value);
    if (!place) return;

    const name = place.name || place.display_name || "Unknown";
    const address = place.display_name || "No address available";

    setInputValue(name); // ✅ Set input field name
    setPlaceId(String(place.place_id)); // ✅ Store place ID
    onPlaceSelect({
      name,
      address,
      placeId: String(place.place_id),
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
    });
  };

  return (
    <AutoComplete
      value={inputValue}
      options={options}
      onChange={setInputValue} // ✅ Allow manual input
      onSelect={handleSelect}
      placeholder="Search place"
      style={{ width: "100%" }}
      filterOption={false}
    />
  );
};

export default GooglePlacesInput;
