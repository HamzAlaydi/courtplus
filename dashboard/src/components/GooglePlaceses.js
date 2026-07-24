import React, { useState, useEffect, useRef } from "react";
import GooglePlacesAutocomplete from "react-google-autocomplete";

const GooglePlacesInput = ({
  apiKey,
  initialName,
  initialPlaceId,
  onPlaceSelect,
}) => {
  const [, setPlaceId] = useState(initialPlaceId || "");
  const [inputValue, setInputValue] = useState(initialName || "");
  const autocompleteRef = useRef(null);

  // ✅ Update input when initial values change
  useEffect(() => {
    if (initialName) setInputValue(initialName);
    if (initialPlaceId) setPlaceId(initialPlaceId);
  }, [initialName, initialPlaceId]);

  return (
    <GooglePlacesAutocomplete
      apiKey="AIzaSyBA82Tqljmxcixjt3dkrSMxYWHCF8Vxt9E"
      ref={autocompleteRef}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)} // ✅ Allow manual input
      onPlaceSelected={(place) => {
        if (place && place.place_id) {
          setInputValue(place.name || "Unknown"); // ✅ Set input field name
          setPlaceId(place.place_id); // ✅ Store place ID
          onPlaceSelect({
            name: place.name || "Unknown",
            address: place.formatted_address || "No address available",
            placeId: place.place_id,
          });
        }
      }}
      options={{
        types: ["establishment"],
        fields: ["place_id", "name", "formatted_address"],
      }}
      style={{
        width: "100%",
        padding: "10px",
        fontSize: "16px",
        border: "1px solid #ccc",
        borderRadius: "5px",
      }}
    />
  );
};

export default GooglePlacesInput;
