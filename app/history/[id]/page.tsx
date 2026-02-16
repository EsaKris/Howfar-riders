"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MapPin, Bike, CheckCircle } from "lucide-react";
import { rideApi, getApiError } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/index";
import type { Ride } from "@/types";
import { format } from "date-fns";

export default function RideDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const [ride,    setRide]    = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    rideApi.detail(id)
      .then(({ data }) => setRide(data))
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <AppShell title="Ride Details" backHref="/history" hideNav>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-2 border-hfc-lime/30 border-t-hfc-lime rounded-full animate-spin" />
      </div>
    </AppShell>
  );

  if (error || !ride) return (
    <AppShell title="Ride Details" backHref="/history" hideNav>
      <div className="px-5 py-10 text-center text-hfc-muted font-body">{error || "Not found"}</div>
    </AppShell>
  );

  return (
    <AppShell title="Ride Details" backHref="/history" hideNav>
      <div className="px-5 py-5 space-y-4 page-enter">

        {/* Header */}
        <div className="flex items-center justify-between">
          <StatusBadge status={ride.status} />
          <span className="text-hfc-muted text-xs font-body">
            {format(new Date(ride.created_at), "MMM d, yyyy · h:mm a")}
          </span>
        </div>

        {/* Price */}
        <div className="bg-hfc-card border border-hfc-border rounded-3xl p-5 flex items-center justify-between">
          <div>
            <p className="text-hfc-muted text-xs font-body">Fare paid</p>
            <p className="font-display font-black text-3xl text-hfc-lime">{ride.price_display}</p>
          </div>
          {ride.status === "COMPLETED" && (
            <CheckCircle size={28} className="text-hfc-green" />
          )}
        </div>

        {/* Route */}
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
                <p className="text-hfc-muted text-xs font-body">From</p>
                <p className="text-white text-sm">{ride.pickup_address}</p>
              </div>
              <div>
                <p className="text-hfc-muted text-xs font-body">To</p>
                <p className="text-white text-sm">{ride.dropoff_address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Driver */}
        {ride.driver && (
          <div className="bg-hfc-card border border-hfc-border rounded-3xl p-5 space-y-3">
            <h3 className="font-display font-bold text-white text-sm">Driver</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-hfc-lime/10 border border-hfc-lime/30 flex items-center justify-center font-display font-black text-hfc-lime">
                {ride.driver.full_name[0]}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{ride.driver.full_name}</p>
                {ride.driver.bike_plate && (
                  <div className="flex items-center gap-1">
                    <Bike size={11} className="text-hfc-muted" />
                    <span className="text-hfc-muted text-xs font-body">{ride.driver.bike_plate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Timeline / Audit log */}
        {ride.status_logs.length > 0 && (
          <div className="bg-hfc-card border border-hfc-border rounded-3xl p-5 space-y-4">
            <h3 className="font-display font-bold text-white text-sm">Timeline</h3>
            <div className="space-y-3">
              {ride.status_logs.map((log, i) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <div className="w-2 h-2 rounded-full bg-hfc-lime flex-shrink-0" />
                    {i < ride.status_logs.length - 1 && (
                      <div className="w-px h-6 bg-hfc-border" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium capitalize">
                      {log.to_status.replace("_", " ").toLowerCase()}
                    </p>
                    <p className="text-hfc-muted text-xs font-body">
                      {format(new Date(log.timestamp), "h:mm a")} · {log.changed_by_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancellation info */}
        {ride.status === "CANCELLED" && ride.cancellation_reason && (
          <div className="bg-hfc-red/5 border border-hfc-red/20 rounded-2xl px-4 py-3">
            <p className="text-hfc-red text-xs font-body">
              Reason: {ride.cancellation_reason}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
