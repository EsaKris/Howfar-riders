"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Phone, Share2, AlertCircle, MapPin, Clock, Navigation, User, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useRideWebSocket } from "@/hooks/useRideWebSocket";
import { api, getApiError } from "@/lib/api";

const RideMap = dynamic(() => import("@/components/Map/RideMap"), { ssr: false });

export default function ActiveRidePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  
  const { driverLocation, rideStatus, isConnected } = useRideWebSocket(id);

  useEffect(() => {
    loadRideDetails();
  }, [id]);

  useEffect(() => {
    if (rideStatus) {
      setRide((prev: any) => prev ? { ...prev, status: rideStatus } : prev);
      
      // Redirect when ride is completed
      if (rideStatus === "completed") {
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      }
    }
  }, [rideStatus, router]);

  const loadRideDetails = async () => {
    try {
      const { data } = await api.get(`/rides/${id}/`);
      if (data.success) {
        setRide(data.ride);
      }
    } catch (error) {
      console.error("Error loading ride:", error);
      alert("Could not load ride details");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const { data } = await api.post(`/rides/${id}/share/`);
      if (data.success) {
        setShareUrl(data.share_url);
        setShowShareModal(true);
        
        // Use native share if available
        if (navigator.share) {
          await navigator.share({
            title: "Track my HFC ride",
            text: "Follow my ride in real-time",
            url: data.share_url,
          });
          setShowShareModal(false);
        }
      }
    } catch (error) {
      console.error("Share error:", error);
      alert("Could not generate share link");
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("Link copied to clipboard!");
  };

  const handleSOS = async () => {
    if (!confirm("This will alert emergency contacts and HFC support. Continue?")) {
      return;
    }

    try {
      await api.post(`/rides/${id}/sos/`);
      alert("Emergency alert sent! HFC support will contact you shortly.");
      setShowSOSModal(false);
    } catch (error) {
      console.error("SOS error:", error);
      alert("Could not send emergency alert. Please call emergency services directly.");
    }
  };

  const handleCancelRide = async () => {
    if (!confirm("Are you sure you want to cancel this ride?")) return;

    try {
      const { data } = await api.post(`/rides/${id}/cancel/`);
      if (data.success) {
        router.push("/dashboard");
      }
    } catch (error) {
      alert(getApiError(error));
    }
  };

  if (loading || !ride) {
    return (
      <div className="h-screen bg-hfc-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-2 border-hfc-lime border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white font-display">Loading ride...</p>
        </div>
      </div>
    );
  }

  const getStatusMessage = () => {
    switch (ride.status) {
      case "pending":
        return "Finding a driver nearby...";
      case "accepted":
        return "Driver is on the way";
      case "started":
        return "Ride in progress";
      case "completed":
        return "Ride completed!";
      case "cancelled":
        return "Ride cancelled";
      default:
        return "Processing...";
    }
  };

  const getStatusColor = () => {
    switch (ride.status) {
      case "pending":
        return "text-hfc-muted";
      case "accepted":
        return "text-hfc-lime";
      case "started":
        return "text-hfc-orange";
      case "completed":
        return "text-hfc-green";
      case "cancelled":
        return "text-hfc-red";
      default:
        return "text-hfc-muted";
    }
  };

  const showMap = ride.status !== "pending" && ride.status !== "cancelled";

  return (
    <div className="h-screen flex flex-col bg-hfc-black">
      {/* Map */}
      {showMap ? (
        <div className="flex-1">
          <RideMap
            pickupLocation={{
              lat: ride.pickup_latitude,
              lng: ride.pickup_longitude,
            }}
            dropoffLocation={{
              lat: ride.dropoff_latitude,
              lng: ride.dropoff_longitude,
            }}
            driverLocation={
              driverLocation
                ? {
                    lat: driverLocation.latitude,
                    lng: driverLocation.longitude,
                    heading: driverLocation.heading,
                  }
                : undefined
            }
            routeGeometry={ride.route_geometry}
            showDriver={!!driverLocation && ride.status !== "completed"}
          />
        </div>
      ) : (
        <div className="flex-1 bg-hfc-dark flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-16 h-16 border-4 border-hfc-lime border-t-transparent rounded-full mx-auto mb-6" />
            <p className="text-white font-display font-bold text-xl mb-2">
              {getStatusMessage()}
            </p>
            <p className="text-hfc-muted text-sm">This usually takes less than 2 minutes</p>
          </div>
        </div>
      )}

      {/* Bottom Panel */}
      <div className="bg-hfc-card border-t border-hfc-border">
        {/* Connection Status */}
        {showMap && (
          <div className="px-6 py-2 border-b border-hfc-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-hfc-green animate-pulse" : "bg-hfc-red"}`} />
              <span className="text-hfc-muted text-xs">
                {isConnected ? "Live tracking" : "Reconnecting..."}
              </span>
            </div>
            {driverLocation?.speed !== undefined && (
              <span className="text-hfc-muted text-xs">
                {Math.round(driverLocation.speed)} km/h
              </span>
            )}
          </div>
        )}

        {/* Status */}
        <div className="px-6 py-4 border-b border-hfc-border text-center">
          <p className={`font-display font-bold text-2xl ${getStatusColor()}`}>
            {getStatusMessage()}
          </p>
          {ride.estimated_duration && ride.status === "accepted" && (
            <p className="text-hfc-muted text-sm mt-1">
              Driver arriving in ~{Math.round(ride.estimated_duration / 60)} minutes
            </p>
          )}
        </div>

        {/* Driver Info */}
        {ride.driver && ride.status !== "pending" && (
          <div className="px-6 py-4 border-b border-hfc-border">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-hfc-lime/10 border-2 border-hfc-lime/20 flex items-center justify-center font-display font-bold text-hfc-lime text-2xl">
                {ride.driver.full_name[0]}
              </div>
              <div className="flex-1">
                <p className="text-white font-display font-bold text-lg">
                  {ride.driver.full_name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <span className="text-hfc-lime">★</span>
                    <span className="text-hfc-muted text-sm">
                      {ride.driver.average_rating?.toFixed(1) || "5.0"}
                    </span>
                  </div>
                  <span className="text-hfc-muted">•</span>
                  <span className="text-hfc-muted text-sm">
                    {ride.bike?.license_plate}
                  </span>
                </div>
              </div>
              <a
                href={`tel:${ride.driver.phone_number}`}
                className="w-12 h-12 rounded-full bg-hfc-lime flex items-center justify-center"
              >
                <Phone size={20} className="text-hfc-black" />
              </a>
            </div>
          </div>
        )}

        {/* Route Details */}
        <div className="px-6 py-4 border-b border-hfc-border space-y-3">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-hfc-lime mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-hfc-muted mb-0.5">Pickup</p>
              <p className="text-white text-sm">{ride.pickup_address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-hfc-orange mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-hfc-muted mb-0.5">Destination</p>
              <p className="text-white text-sm">{ride.dropoff_address}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 pt-2">
            <div className="flex-1 bg-hfc-dark rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-hfc-muted text-xs mb-1">
                <Navigation size={12} />
                <span>Distance</span>
              </div>
              <p className="text-white font-display font-bold">
                {ride.estimated_distance?.toFixed(1)} km
              </p>
            </div>
            <div className="flex-1 bg-hfc-dark rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-hfc-muted text-xs mb-1">
                <Clock size={12} />
                <span>Duration</span>
              </div>
              <p className="text-white font-display font-bold">
                {Math.round((ride.estimated_duration || 0) / 60)} min
              </p>
            </div>
            <div className="flex-1 bg-hfc-dark rounded-lg p-3 text-center">
              <p className="text-hfc-muted text-xs mb-1">Fare</p>
              <p className="text-hfc-lime font-display font-bold">
                ₦{ride.fare?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4">
          <div className="flex gap-3">
            {ride.status !== "completed" && ride.status !== "cancelled" && (
              <>
                <button
                  onClick={handleShare}
                  className="flex-1 bg-hfc-dark border border-hfc-border text-white font-display font-bold py-3 rounded-xl hover:border-hfc-lime/50 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 size={18} />
                  Share Trip
                </button>
                
                <button
                  onClick={() => setShowSOSModal(true)}
                  className="flex-1 bg-hfc-red text-white font-display font-bold py-3 rounded-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  <AlertCircle size={18} />
                  SOS
                </button>
              </>
            )}
            
            {ride.status === "pending" && (
              <button
                onClick={handleCancelRide}
                className="w-full bg-hfc-dark border border-hfc-border text-hfc-red font-display font-bold py-3 rounded-xl hover:bg-hfc-red hover:text-white transition-all"
              >
                Cancel Ride
              </button>
            )}
            
            {ride.status === "completed" && (
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-hfc-lime text-hfc-black font-display font-bold py-3 rounded-xl hover:bg-white transition-all"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="bg-hfc-card border border-hfc-border rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-white text-xl">Share Your Ride</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-hfc-muted hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-hfc-muted text-sm mb-4">
              Share this link with friends or family to let them track your ride in real-time.
            </p>
            <div className="bg-hfc-dark rounded-lg p-3 mb-4">
              <p className="text-white text-sm break-all">{shareUrl}</p>
            </div>
            <button
              onClick={copyShareLink}
              className="w-full bg-hfc-lime text-hfc-black font-display font-bold py-3 rounded-xl hover:bg-white transition-all"
            >
              Copy Link
            </button>
          </div>
        </div>
      )}

      {/* SOS Modal */}
      {showSOSModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="bg-hfc-card border border-hfc-red rounded-2xl p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-hfc-red/10 border-2 border-hfc-red flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-hfc-red" />
              </div>
              <h3 className="font-display font-bold text-white text-xl mb-2">
                Emergency SOS
              </h3>
              <p className="text-hfc-muted text-sm">
                This will immediately alert HFC support and your emergency contacts with your current location.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSOSModal(false)}
                className="flex-1 bg-hfc-dark border border-hfc-border text-white font-display font-bold py-3 rounded-xl hover:border-hfc-border transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSOS}
                className="flex-1 bg-hfc-red text-white font-display font-bold py-3 rounded-xl hover:bg-red-600 transition-all"
              >
                Send Alert
              </button>
            </div>
            <p className="text-center text-hfc-muted text-xs mt-4">
              For immediate danger, call emergency services: 112
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
