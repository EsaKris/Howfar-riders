"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { MapPin, ArrowRight, ArrowLeft, Clock, Navigation, Search, Navigation2, X } from "lucide-react";
import L from "leaflet";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";
import "leaflet/dist/leaflet.css";

// Dynamically import leaflet components (client‑only)
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });

// Dynamically import our custom click handler (client‑only)
const MapClickHandler = dynamic(() => import("@/components/Map/MapClickHandler"), { ssr: false });

const FIXED_FARE = 500;

// Custom marker icon (same style as dashboard)
const customIcon = new L.Icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='40' viewBox='0 0 32 40'%3E%3Cpath d='M16,0 C7.2,0 0,7.2 0,16 C0,24.8 16,40 16,40 S32,24.8 32,16 C32,7.2 24.8,0 16,0 Z' fill='%23C8F53F' stroke='%23000' stroke-width='2'/%3E%3Ccircle cx='16' cy='16' r='6' fill='%23000'/%3E%3C/svg%3E",
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
});

export default function RequestRidePage() {
  const router = useRouter();
  const [step, setStep] = useState<"pickup" | "dropoff" | "confirm">("pickup");

  const [pickup, setPickup] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [dropoff, setDropoff] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [route, setRoute] = useState<any>(null);

  const [markerPosition, setMarkerPosition] = useState<[number, number]>([7.7333, 8.5333]); // Makurdi default
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  // MOCK reverse geocode
  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const fakeAddress = `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    setAddress(fakeAddress);
    setLoading(false);
    return fakeAddress;
  };

  // Map click handler
  const handleMapClick = async (lat: number, lng: number) => {
    setMarkerPosition([lat, lng]);
    const addr = await reverseGeocode(lat, lng);

    if (step === "pickup") {
      setPickup({ lat, lng, address: addr });
      setStep("dropoff");
    } else if (step === "dropoff") {
      setDropoff({ lat, lng, address: addr });
      await fetchRoute(lat, lng);
    }
  };

  // MOCK fetch route
  const fetchRoute = async (destLat: number, destLng: number) => {
    if (!pickup) return;
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const mockRoute = {
      distance: 3.2,
      duration: 480,
      geometry: [
        [pickup.lat, pickup.lng],
        [(pickup.lat + destLat)/2, (pickup.lng + destLng)/2],
        [destLat, destLng]
      ],
      polyline: "mock_polyline"
    };
    setRoute(mockRoute);
    setStep("confirm");
    setLoading(false);
  };

  // Current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setMarkerPosition([latitude, longitude]);
        const addr = await reverseGeocode(latitude, longitude);
        if (step === "pickup") {
          setPickup({ lat: latitude, lng: longitude, address: addr });
          setStep("dropoff");
        } else if (step === "dropoff") {
          setDropoff({ lat: latitude, lng: longitude, address: addr });
          await fetchRoute(latitude, longitude);
        }
      },
      () => alert("Could not get your location")
    );
  };

  // MOCK search autocomplete
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setShowSuggestions(true);
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 300));
    const mockSuggestions = [
      {
        main_text: query + " Main Road",
        secondary_text: "Makurdi, Benue",
        latitude: 7.7333,
        longitude: 8.5333,
        description: query + " Main Road, Makurdi"
      },
      {
        main_text: query + " Market",
        secondary_text: "Makurdi, Benue",
        latitude: 7.7320,
        longitude: 8.5340,
        description: query + " Market, Makurdi"
      }
    ];
    setSuggestions(mockSuggestions);
  };

  const selectSuggestion = async (suggestion: any) => {
    const { latitude, longitude, description } = suggestion;
    setMarkerPosition([latitude, longitude]);
    setAddress(description);
    setSearchQuery(description);
    setSuggestions([]);
    setShowSuggestions(false);

    if (step === "pickup") {
      setPickup({ lat: latitude, lng: longitude, address: description });
      setStep("dropoff");
    } else if (step === "dropoff") {
      setDropoff({ lat: latitude, lng: longitude, address: description });
      await fetchRoute(latitude, longitude);
    }
  };

  // Confirm ride creation (still using real API – will need auth fixed)
  const handleConfirmRide = async () => {
    if (!pickup || !dropoff || !route) return;
    setLoading(true);
    try {
      const { data } = await api.post("/rides/", {
        pickup_latitude: pickup.lat,
        pickup_longitude: pickup.lng,
        pickup_address: pickup.address,
        dropoff_latitude: dropoff.lat,
        dropoff_longitude: dropoff.lng,
        dropoff_address: dropoff.address,
        route_polyline: route.polyline,
        route_geometry: route.geometry,
        estimated_duration: route.duration,
        estimated_distance: route.distance,
        fare: FIXED_FARE,
      });
      if (data.success) {
        router.push(`/rides/${data.ride.id}`);
      }
    } catch (error) {
      console.error("Ride creation error:", error);
      alert("Could not request ride");
    } finally {
      setLoading(false);
    }
  };

  const resetToPickup = () => {
    setStep("pickup");
    setPickup(null);
    setDropoff(null);
    setRoute(null);
    setAddress("");
    setSearchQuery("");
    setMarkerPosition([7.7333, 8.5333]);
  };

  return (
    <div className="min-h-screen bg-hfc-black flex items-center justify-center p-4">
      {/* Phone-like container */}
      <div className="w-full max-w-md bg-hfc-black rounded-3xl overflow-hidden border border-hfc-border shadow-2xl">
        {/* Header with back button */}
        <div className="bg-hfc-card border-b border-hfc-border px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-1 -ml-1 hover:bg-hfc-card-hover rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-hfc-muted" />
          </button>
          <div>
            <h1 className="font-display font-bold text-white text-xl">
              {step === "pickup" && "Choose pickup location"}
              {step === "dropoff" && "Choose destination"}
              {step === "confirm" && "Confirm your ride"}
            </h1>
            <p className="text-hfc-muted text-sm mt-1">
              {step === "pickup" && "Tap on map or search for your location"}
              {step === "dropoff" && "Where do you want to go?"}
              {step === "confirm" && "Review your trip details"}
            </p>
          </div>
        </div>

        {/* Map container – fixed height */}
        <div className="relative h-96">
          {step !== "confirm" && (
            <>
              {/* Search bar */}
              <div className="absolute top-4 left-4 right-4 z-[1000]">
                <div className="bg-hfc-card border border-hfc-border rounded-xl shadow-lg">
                  <div className="flex items-center gap-2 px-4 py-3">
                    <Search size={18} className="text-hfc-muted flex-shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Search for a location..."
                      className="flex-1 bg-transparent outline-none text-white placeholder:text-hfc-muted text-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSuggestions([]);
                          setShowSuggestions(false);
                        }}
                        className="p-1 hover:bg-hfc-card-hover rounded transition-colors"
                      >
                        <X size={16} className="text-hfc-muted" />
                      </button>
                    )}
                    <button
                      onClick={getCurrentLocation}
                      className="p-2 hover:bg-hfc-card-hover rounded-lg transition-colors flex-shrink-0"
                    >
                      <Navigation2 size={18} className="text-hfc-lime" />
                    </button>
                  </div>

                  {/* Suggestions */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="border-t border-hfc-border max-h-40 overflow-y-auto">
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectSuggestion(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-hfc-card-hover transition-colors border-b border-hfc-border last:border-0"
                        >
                          <p className="text-sm font-medium text-white">{suggestion.main_text}</p>
                          <p className="text-xs text-hfc-muted mt-0.5">{suggestion.secondary_text}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Map */}
              <MapContainer
                center={markerPosition}
                zoom={15}
                style={{ width: "100%", height: "100%" }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onMapClick={handleMapClick} />
                <Marker position={markerPosition} icon={customIcon} />
              </MapContainer>

              {/* Selected address display */}
              {address && (
                <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-hfc-card border border-hfc-border rounded-xl shadow-lg px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-hfc-lime/10 border border-hfc-lime/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-hfc-lime" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-hfc-muted mb-1">Selected Location</p>
                      <p className="text-sm font-medium text-white">{address}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[1001]">
                  <div className="bg-hfc-card rounded-xl px-6 py-4 border border-hfc-border">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin w-5 h-5 border-2 border-hfc-lime border-t-transparent rounded-full" />
                      <p className="text-white text-sm">Getting address...</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Confirm step map */}
          {step === "confirm" && route && pickup && dropoff && (
            <MapContainer
              center={[pickup.lat, pickup.lng]}
              zoom={14}
              style={{ width: "100%", height: "100%" }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[pickup.lat, pickup.lng]} icon={customIcon} />
              <Marker position={[dropoff.lat, dropoff.lng]} icon={customIcon} />
              {route.geometry && (
                <Polyline positions={route.geometry} pathOptions={{ color: "#C8F53F", weight: 4 }} />
              )}
            </MapContainer>
          )}
        </div>

        {/* Bottom panel – only for confirm step */}
        {step === "confirm" && route && pickup && dropoff && (
          <div className="bg-hfc-card border-t border-hfc-border p-5 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-hfc-lime mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-hfc-muted">Pickup</p>
                  <p className="text-white text-sm">{pickup.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-hfc-orange mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-hfc-muted">Destination</p>
                  <p className="text-white text-sm">{dropoff.address}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 text-center">
              <div className="flex-1 bg-hfc-dark rounded-lg p-3">
                <p className="text-hfc-muted text-xs flex items-center justify-center gap-1">
                  <Navigation size={12} /> Distance
                </p>
                <p className="text-white font-display font-bold mt-1">
                  {route.distance.toFixed(1)} km
                </p>
              </div>
              <div className="flex-1 bg-hfc-dark rounded-lg p-3">
                <p className="text-hfc-muted text-xs flex items-center justify-center gap-1">
                  <Clock size={12} /> Duration
                </p>
                <p className="text-white font-display font-bold mt-1">
                  {Math.round(route.duration / 60)} min
                </p>
              </div>
              <div className="flex-1 bg-hfc-dark rounded-lg p-3">
                <p className="text-hfc-muted text-xs">Fare</p>
                <p className="text-hfc-lime font-display font-bold mt-1">₦{FIXED_FARE}</p>
              </div>
            </div>

            <Button
              onClick={handleConfirmRide}
              loading={loading}
              fullWidth
              size="lg"
              className="mt-2"
            >
              Confirm & Request Ride
              <ArrowRight size={18} className="ml-2" />
            </Button>

            <button
              onClick={resetToPickup}
              className="w-full text-center text-hfc-muted text-sm hover:text-white transition-colors"
            >
              ← Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}