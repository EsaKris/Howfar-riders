"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { MapPin, Navigation, StickyNote } from "lucide-react";
import { rideApi, getApiError } from "@/lib/api";
import { Input } from "@/components/ui/index";
import Button from "@/components/ui/Button";
import type { RideRequestPayload } from "@/types";

const FIXED_FARE = 500;

type FormValues = {
  pickup_address:  string;
  dropoff_address: string;
  rider_notes:     string;
};

export default function RequestRidePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

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
      router.push(`/ride?id=${res.ride.id}`);
    } catch (err) {
      setApiError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hfc-black px-5 pt-6 pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-white text-2xl">Request a ride</h1>
        <p className="text-hfc-muted text-sm mt-1">Fixed fare – always ₦500 in Makurdi</p>
      </div>

      {/* Form */}
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
          <div className="bg-hfc-red/10 border border-hfc-red/30 text-hfc-red rounded-2xl px-4 py-3 text-sm">
            {apiError}
          </div>
        )}

        <Button type="submit" loading={loading} fullWidth size="lg" className="mt-4">
          Request Ride · ₦{FIXED_FARE}
        </Button>

        <button
          type="button"
          onClick={() => router.back()}
          className="w-full text-center text-hfc-muted text-sm hover:text-white transition-colors mt-2"
        >
          ← Go back
        </button>
      </form>
    </div>
  );
}