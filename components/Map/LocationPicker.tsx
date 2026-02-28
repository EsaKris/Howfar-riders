"use client";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
let L: typeof import("leaflet");

if (typeof window !== "undefined") {
  L = require("leaflet");
}
import { Search, Navigation2, X } from "lucide-react";
import { api } from "@/lib/api";
import "leaflet/dist/leaflet.css";

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='40' viewBox='0 0 32 40'%3E%3Cpath d='M16,0 C7.2,0 0,7.2 0,16 C0,24.8 16,40 16,40 S32,24.8 32,16 C32,7.2 24.8,0 16,0 Z' fill='%23C8F53F' stroke='%23000' stroke-width='2'/%3E%3Ccircle cx='16' cy='16' r='6' fill='%23000'/%3E%3C/svg%3E",
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
});

function DraggableMarker({
  position,
  setPosition,
  onLocationChange,
}: {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
  onLocationChange: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const latlng = marker.getLatLng();
        setPosition([latlng.lat, latlng.lng]);
        onLocationChange(latlng.lat, latlng.lng);
      }
    },
  };

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={customIcon}
    />
  );
}

function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface LocationPickerProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address: string;
  }) => void;
  initialLocation?: { lat: number; lng: number };
}

export default function LocationPicker({
  onLocationSelect,
  initialLocation,
}: LocationPickerProps) {
  const [center, setCenter] = useState<[number, number]>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : [7.7333, 8.5333] // Makurdi
  );
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(center);
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const { data } = await api.post("/maps/reverse-geocode/", {
        latitude: lat,
        longitude: lng,
      });

      if (data.success) {
        setAddress(data.address);
        onLocationSelect({ lat, lng, address: data.address });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setAddress("Unknown location");
    } finally {
      setLoading(false);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setCenter(pos);
          setMarkerPosition(pos);
          reverseGeocode(pos[0], pos[1]);
        },
        () => {
          alert("Could not get your location");
        }
      );
    }
  };

  // Handle location change from map interaction
  const handleLocationChange = (lat: number, lng: number) => {
    setMarkerPosition([lat, lng]);
    reverseGeocode(lat, lng);
  };

  // Search address
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setShowSuggestions(true);

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const { data } = await api.post("/maps/autocomplete/", {
        input: query,
        latitude: center[0],
        longitude: center[1],
      });

      if (data.success) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Autocomplete error:", error);
    }
  };

  // Select suggestion
  const selectSuggestion = (suggestion: any) => {
    const pos: [number, number] = [suggestion.latitude, suggestion.longitude];
    setCenter(pos);
    setMarkerPosition(pos);
    setAddress(suggestion.description);
    setSearchQuery(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);

    onLocationSelect({
      lat: suggestion.latitude,
      lng: suggestion.longitude,
      address: suggestion.description,
    });
  };

  return (
    <div className="relative w-full h-full">
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000]">
        <div className="bg-white rounded-xl shadow-lg">
          <div className="flex items-center gap-2 px-4 py-3">
            <Search size={18} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search for a location..."
              className="flex-1 outline-none text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            )}
            <button
              onClick={getCurrentLocation}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <Navigation2 size={18} className="text-hfc-lime" />
            </button>
          </div>

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="border-t border-gray-100 max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => selectSuggestion(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {suggestion.main_text}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {suggestion.secondary_text}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={center}
        zoom={15}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onLocationChange={handleLocationChange} />

        <DraggableMarker
          position={markerPosition}
          setPosition={setMarkerPosition}
          onLocationChange={handleLocationChange}
        />
      </MapContainer>

      {/* Selected Address Display */}
      {address && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-white rounded-xl shadow-lg px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-hfc-lime flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-hfc-black" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Selected Location</p>
              <p className="text-sm font-medium text-gray-900">{address}</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-[1001]">
          <div className="bg-white rounded-lg px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-hfc-lime border-t-transparent rounded-full" />
              <p className="text-sm">Getting address...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
