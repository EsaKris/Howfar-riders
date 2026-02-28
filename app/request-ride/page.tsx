"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ArrowRight, Clock, Navigation } from "lucide-react";
import LocationPicker from "@/components/Map/LocationPicker";
import RideMap from "@/components/Map/RideMap";
import { api } from "@/lib/api";

export default function RequestRidePage() {
  const router = useRouter();
  const [step, setStep] = useState<"pickup" | "dropoff" | "confirm">("pickup");
  const [pickup, setPickup] = useState<any>(null);
  const [dropoff, setDropoff] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePickupSelect = (location: any) => {
    setPickup(location);
    setStep("dropoff");
  };

  const handleDropoffSelect = async (location: any) => {
    setDropoff(location);
    setLoading(true);

    try {
      // Get route details
      const { data } = await api.post("/maps/route/", {
        origin_lat: pickup.lat,
        origin_lng: pickup.lng,
        dest_lat: location.lat,
        dest_lng: location.lng,
      });

      if (data.success) {
        setRoute(data.route);
        setStep("confirm");
      }
    } catch (error) {
      console.error("Error getting route:", error);
      alert("Could not calculate route");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRide = async () => {
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
      });

      if (data.success) {
        router.push(`/rides/${data.ride.id}`);
      }
    } catch (error) {
      console.error("Error requesting ride:", error);
      alert("Could not request ride");
    } finally {
      setLoading(false);
    }
  };

  const calculateFare = (distance: number): number => {
    const baseFare = 200;
    const perKm = 150;
    return Math.round(baseFare + distance * perKm);
  };

  return (
    <div className="h-screen flex flex-col bg-hfc-black">
      {/* Header */}
      <div className="bg-hfc-card border-b border-hfc-border px-6 py-4">
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

      {/* Map or Confirm View */}
      <div className="flex-1 relative">
        {step === "pickup" && (
          <LocationPicker onLocationSelect={handlePickupSelect} />
        )}

        {step === "dropoff" && (
          <LocationPicker
            onLocationSelect={handleDropoffSelect}
            initialLocation={pickup ? { lat: pickup.lat, lng: pickup.lng } : undefined}
          />
        )}

        {step === "confirm" && route && (
          <div className="h-full flex flex-col">
            {/* Map showing route */}
            <div className="flex-1">
              <RideMap
                pickupLocation={{ lat: pickup.lat, lng: pickup.lng }}
                dropoffLocation={{ lat: dropoff.lat, lng: dropoff.lng }}
                routeGeometry={route.geometry}
              />
            </div>

            {/* Ride details */}
            <div className="bg-hfc-card border-t border-hfc-border p-6 space-y-4">
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

              <div className="flex gap-4 text-center">
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
                  <p className="text-hfc-lime font-display font-bold mt-1">
                    ₦{calculateFare(route.distance).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={handleConfirmRide}
                disabled={loading}
                className="w-full bg-hfc-lime text-hfc-black font-display font-bold py-4 rounded-xl hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Finding driver..." : "Confirm & Request Ride"}
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => setStep("pickup")}
                className="w-full text-hfc-muted text-sm hover:text-white transition-colors"
              >
                ← Start over
              </button>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-hfc-card rounded-xl p-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-hfc-lime border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-white font-medium">
              {step === "dropoff" ? "Calculating route..." : "Processing..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
