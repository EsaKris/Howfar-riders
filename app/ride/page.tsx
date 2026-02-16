"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Phone, X, CheckCircle, Clock, Bike } from "lucide-react";
import { rideApi, getApiError } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/index";
import Button from "@/components/ui/Button";
import type { Ride } from "@/types";

const STATUS_STEPS: Record<string, number> = {
  REQUESTED:   0,
  ASSIGNED:    1,
  IN_PROGRESS: 2,
  COMPLETED:   3,
};

export default function RidePage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const rideId       = searchParams.get("id");

  const [ride,       setRide]       = useState<Ride | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [apiError,   setApiError]   = useState("");

  const fetchRide = useCallback(async () => {
    if (!rideId) return;
    try {
      const { data } = await rideApi.detail(rideId);
      setRide(data);
    } catch (err) {
      setApiError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    fetchRide();
    // Poll every 8 seconds while ride is active
    const interval = setInterval(() => {
      if (ride && !["COMPLETED", "CANCELLED"].includes(ride.status)) {
        fetchRide();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchRide, ride?.status]);

  const handleCancel = async () => {
    if (!rideId) return;
    setCancelling(true);
    try {
      const { data } = await rideApi.cancel(rideId, "Cancelled by rider");
      setRide(data.ride);
      setShowCancel(false);
    } catch (err) {
      setApiError(getApiError(err));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Your Ride" backHref="/dashboard" hideNav>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="space-y-3 text-center">
            <div className="w-12 h-12 border-2 border-hfc-lime/30 border-t-hfc-lime rounded-full animate-spin mx-auto" />
            <p className="text-hfc-muted text-sm font-body">Loading your ride…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!ride || apiError) {
    return (
      <AppShell title="Your Ride" backHref="/dashboard" hideNav>
        <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center space-y-4">
          <p className="text-hfc-muted font-body">{apiError || "Ride not found."}</p>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to Home
          </Button>
        </div>
      </AppShell>
    );
  }

  const isActive    = !["COMPLETED", "CANCELLED"].includes(ride.status);
  const stepIndex   = STATUS_STEPS[ride.status] ?? 0;
  const canCancel   = ride.status === "REQUESTED";

  return (
    <AppShell
      title="Your Ride"
      backHref="/dashboard"
      hideNav
      rightSlot={
        isActive && (
          <button
            onClick={fetchRide}
            className="text-hfc-lime text-xs font-body hover:text-white transition-colors"
          >
            Refresh
          </button>
        )
      }
    >
      <div className="px-5 py-5 space-y-5 page-enter">

        {/* Status card */}
        <div className="bg-hfc-card border border-hfc-border rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={ride.status} />
            <span className="font-display font-black text-hfc-lime text-xl">{ride.price_display}</span>
          </div>

          {/* Progress bar */}
          {ride.status !== "CANCELLED" && (
            <div className="space-y-2">
              <div className="flex justify-between">
                {["Requested", "Assigned", "In Progress", "Completed"].map((label, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      i <= stepIndex
                        ? "bg-hfc-lime border-hfc-lime"
                        : "border-hfc-border"
                    }`}>
                      {i < stepIndex && <CheckCircle size={10} className="text-hfc-black" />}
                    </div>
                    <span className={`text-[9px] font-body text-center leading-tight ${
                      i <= stepIndex ? "text-hfc-lime" : "text-hfc-muted"
                    }`}>{label}</span>
                  </div>
                ))}
              </div>
              <div className="relative h-1 bg-hfc-border rounded-full">
                <div
                  className="absolute left-0 top-0 h-1 bg-hfc-lime rounded-full transition-all duration-700"
                  style={{ width: `${(stepIndex / 3) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Route card */}
        <div className="bg-hfc-card border border-hfc-border rounded-3xl p-5 space-y-4">
          <h3 className="font-display font-bold text-white text-sm">Trip Route</h3>
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1 mt-0.5">
              <div className="w-3 h-3 rounded-full border-2 border-hfc-lime" />
              <div className="w-px h-8 bg-hfc-border" />
              <div className="w-3 h-3 rounded-full bg-hfc-orange" />
            </div>
            <div className="space-y-4 flex-1 min-w-0">
              <div>
                <p className="text-hfc-muted text-xs font-body">Pickup</p>
                <p className="text-white text-sm font-medium">{ride.pickup_address}</p>
              </div>
              <div>
                <p className="text-hfc-muted text-xs font-body">Dropoff</p>
                <p className="text-white text-sm font-medium">{ride.dropoff_address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Driver card */}
        {ride.driver ? (
          <div className="bg-hfc-card border border-hfc-lime/20 rounded-3xl p-5 space-y-4">
            <h3 className="font-display font-bold text-white text-sm">Your Driver</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-hfc-lime/10 border border-hfc-lime/30 flex items-center justify-center font-display font-black text-hfc-lime text-xl">
                {ride.driver.full_name[0]}
              </div>
              <div className="flex-1">
                <p className="text-white font-display font-bold">{ride.driver.full_name}</p>
                {ride.driver.bike_plate && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Bike size={12} className="text-hfc-muted" />
                    <span className="text-hfc-muted text-xs font-body">{ride.driver.bike_plate}</span>
                  </div>
                )}
              </div>
              <a
                href={`tel:${ride.driver.phone_number}`}
                className="w-10 h-10 rounded-2xl bg-hfc-lime/10 border border-hfc-lime/30 flex items-center justify-center text-hfc-lime hover:bg-hfc-lime/20 transition-colors"
              >
                <Phone size={16} />
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-hfc-card border border-hfc-border rounded-3xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-hfc-card border border-hfc-border flex items-center justify-center">
              <Clock size={20} className="text-hfc-muted animate-pulse" />
            </div>
            <div>
              <p className="text-white font-display font-bold text-sm">Finding your driver…</p>
              <p className="text-hfc-muted text-xs font-body">Usually takes 1–3 minutes</p>
            </div>
          </div>
        )}

        {/* Completed / Cancelled states */}
        {ride.status === "COMPLETED" && (
          <div className="bg-hfc-green/5 border border-hfc-green/30 rounded-3xl p-5 text-center space-y-3">
            <CheckCircle size={32} className="text-hfc-green mx-auto" />
            <p className="font-display font-bold text-white">Ride Completed!</p>
            <p className="text-hfc-muted text-sm font-body">
              You were charged <span className="text-white font-bold">{ride.price_display}</span>.
              Thanks for riding with HFC 🎉
            </p>
            <Button fullWidth onClick={() => router.push("/dashboard")}>
              Back to Home
            </Button>
          </div>
        )}

        {ride.status === "CANCELLED" && (
          <div className="bg-hfc-red/5 border border-hfc-red/30 rounded-3xl p-5 text-center space-y-3">
            <X size={32} className="text-hfc-red mx-auto" />
            <p className="font-display font-bold text-white">Ride Cancelled</p>
            <p className="text-hfc-muted text-sm font-body">
              {ride.cancellation_reason || "This ride was cancelled."}
            </p>
            <Button fullWidth onClick={() => router.push("/dashboard")}>
              Request New Ride
            </Button>
          </div>
        )}

        {/* Cancel button */}
        {canCancel && (
          <Button
            variant="danger"
            fullWidth
            onClick={() => setShowCancel(true)}
          >
            <X size={16} /> Cancel Ride
          </Button>
        )}
      </div>

      {/* Cancel confirmation sheet */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCancel(false)}
          />
          <div className="relative w-full max-w-md bg-hfc-dark border-t border-hfc-border rounded-t-3xl p-6 space-y-5 animate-slide-up">
            <div className="w-10 h-1 bg-hfc-border rounded-full mx-auto" />
            <h3 className="font-display font-bold text-white text-xl">Cancel this ride?</h3>
            <p className="text-hfc-muted text-sm font-body">
              You can only cancel before a driver is assigned. This ride is currently waiting.
            </p>
            {apiError && (
              <p className="text-hfc-red text-sm font-body">{apiError}</p>
            )}
            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setShowCancel(false)}>
                Keep Ride
              </Button>
              <Button variant="danger" fullWidth loading={cancelling} onClick={handleCancel}>
                Yes, Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
