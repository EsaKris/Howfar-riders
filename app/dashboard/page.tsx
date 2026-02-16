"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Navigation, StickyNote, ChevronRight, Bike } from "lucide-react";
import { useForm } from "react-hook-form";
import { rideApi, getApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/layout/AppShell";
import { Input, StatusBadge } from "@/components/ui/index";
import Button from "@/components/ui/Button";
import type { Ride, RideRequestPayload } from "@/types";
import { formatDistanceToNow } from "date-fns";

type FormValues = {
  pickup_address:  string;
  dropoff_address: string;
  rider_notes:     string;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [loading,    setLoading]    = useState(false);
  const [apiError,   setApiError]   = useState("");
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [checking,   setChecking]   = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  // Check if rider has an active ride on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await rideApi.history();
        const active = data.results.find((r) =>
          ["REQUESTED", "ASSIGNED", "IN_PROGRESS"].includes(r.status)
        );
        if (active) setActiveRide(active);
      } catch {
        // silent
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setApiError("");
    try {
      const payload: RideRequestPayload = {
        pickup_address:  data.pickup_address.trim(),
        dropoff_address: data.dropoff_address.trim(),
        rider_notes:     data.rider_notes.trim(),
      };
      const { data: res } = await rideApi.request(payload);
      reset();
      router.push(`/ride?id=${res.ride.id}`);
    } catch (err) {
      setApiError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.full_name?.split(" ")[0] ?? "Rider";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AppShell title="">
      <div className="px-5 pt-4 pb-6 space-y-6 page-enter">

        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-hfc-muted text-sm font-body">{greeting},</p>
            <h2 className="font-display font-bold text-white text-2xl">{firstName} 👋</h2>
          </div>
          <div className="w-10 h-10 rounded-full bg-hfc-lime/10 border border-hfc-lime/30 flex items-center justify-center font-display font-black text-hfc-lime">
            {user?.full_name?.[0] ?? "?"}
          </div>
        </div>

        {/* Fare pill */}
        <div className="flex items-center gap-2 bg-hfc-card border border-hfc-border rounded-2xl px-4 py-3">
          <div className="w-8 h-8 rounded-xl bg-hfc-lime/10 flex items-center justify-center">
            <Bike size={16} className="text-hfc-lime" />
          </div>
          <div className="flex-1">
            <p className="text-white font-display font-bold text-sm">Fixed fare — always ₦500</p>
            <p className="text-hfc-muted text-xs font-body">No surge. No surprises. Makurdi only.</p>
          </div>
          <span className="font-display font-black text-hfc-lime text-xl">₦500</span>
        </div>

        {/* Active ride banner */}
        {!checking && activeRide && (
          <button
            onClick={() => router.push(`/ride?id=${activeRide.id}`)}
            className="w-full bg-hfc-lime/5 border border-hfc-lime/30 rounded-3xl p-5 text-left space-y-3 hover:border-hfc-lime/60 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <StatusBadge status={activeRide.status} />
              <ChevronRight size={16} className="text-hfc-lime" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">You have an active ride</p>
              <p className="text-hfc-muted text-xs font-body truncate">
                → {activeRide.dropoff_address}
              </p>
            </div>
          </button>
        )}

        {/* Request form */}
        {!activeRide && (
          <div className="space-y-4">
            <h3 className="font-display font-bold text-white text-lg">Where are you going?</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Pickup Location"
                placeholder="e.g. Wurukum Market, Makurdi"
                leftIcon={<Navigation size={15} className="text-hfc-lime" />}
                error={errors.pickup_address?.message}
                {...register("pickup_address", {
                  required: "Enter your pickup location",
                  minLength: { value: 5, message: "Please be more specific" },
                })}
              />

              <Input
                label="Dropoff Location"
                placeholder="e.g. North Bank Bridge, Makurdi"
                leftIcon={<MapPin size={15} className="text-hfc-orange" />}
                error={errors.dropoff_address?.message}
                {...register("dropoff_address", {
                  required: "Enter your destination",
                  minLength: { value: 5, message: "Please be more specific" },
                  validate: (val, { pickup_address }) =>
                    val.trim().toLowerCase() !== pickup_address.trim().toLowerCase() ||
                    "Pickup and dropoff cannot be the same",
                })}
              />

              <Input
                label="Notes for driver (optional)"
                placeholder="e.g. I'm wearing a red shirt, gate 2..."
                leftIcon={<StickyNote size={15} />}
                {...register("rider_notes")}
              />

              {apiError && (
                <div className="bg-hfc-red/10 border border-hfc-red/30 text-hfc-red rounded-2xl px-4 py-3 text-sm font-body">
                  {apiError}
                </div>
              )}

              <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
                Request Ride · ₦500
              </Button>
            </form>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Ride History",  sub: "View past rides",    href: "/history",  color: "border-hfc-border hover:border-hfc-lime/30" },
            { label: "Your Profile",  sub: "Edit your details",  href: "/profile",  color: "border-hfc-border hover:border-hfc-orange/30" },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`bg-hfc-card border ${item.color} rounded-2xl p-4 text-left transition-all active:scale-[0.97]`}
            >
              <p className="font-display font-bold text-white text-sm">{item.label}</p>
              <p className="text-hfc-muted text-xs font-body mt-0.5">{item.sub}</p>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
