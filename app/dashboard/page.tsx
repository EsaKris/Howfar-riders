"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bike, ChevronRight } from "lucide-react";
import { rideApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/index";
import Button from "@/components/ui/Button";
import type { Ride } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [checking, setChecking] = useState(true);

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
            onClick={() => router.push(`/rides/${activeRide.id}`)}
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

        {/* Request ride CTA */}
        {!activeRide && (
          <div className="space-y-4">
            <h3 className="font-display font-bold text-white text-lg">Ready to ride?</h3>
            <Button
              onClick={() => router.push("/request")}
              fullWidth
              size="lg"
              className="mt-2"
            >
              Request a ride · ₦500
            </Button>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Ride History", sub: "View past rides", href: "/history", color: "border-hfc-border hover:border-hfc-lime/30" },
            { label: "Your Profile", sub: "Edit your details", href: "/profile", color: "border-hfc-border hover:border-hfc-orange/30" },
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