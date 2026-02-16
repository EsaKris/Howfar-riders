"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, Search } from "lucide-react";
import { rideApi } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";
import { RideCard } from "@/components/ui/index";
import type { Ride, RideStatus } from "@/types";

const TABS: { label: string; value: RideStatus | "" }[] = [
  { label: "All",         value: "" },
  { label: "Active",      value: "REQUESTED" },
  { label: "Completed",   value: "COMPLETED" },
  { label: "Cancelled",   value: "CANCELLED" },
];

export default function HistoryPage() {
  const router = useRouter();
  const [rides,     setRides]     = useState<Ride[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<RideStatus | "">("");
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    setLoading(true);
    rideApi.history(tab || undefined)
      .then(({ data }) => setRides(data.results))
      .catch(() => setRides([]))
      .finally(() => setLoading(false));
  }, [tab]);

  const filtered = rides.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.pickup_address.toLowerCase().includes(q) ||
      r.dropoff_address.toLowerCase().includes(q) ||
      r.driver?.full_name.toLowerCase().includes(q)
    );
  });

  return (
    <AppShell title="Ride History">
      <div className="px-5 py-5 space-y-5 page-enter">

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-hfc-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by location or driver…"
            className="w-full bg-hfc-card border border-hfc-border rounded-2xl pl-10 pr-4 py-3 text-white font-body text-sm placeholder-hfc-muted focus:outline-none focus:border-hfc-lime/50"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-display font-bold transition-all ${
                tab === t.value
                  ? "bg-hfc-lime text-hfc-black"
                  : "bg-hfc-card border border-hfc-border text-hfc-muted hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-hfc-card border border-hfc-border rounded-3xl p-5 h-36 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-hfc-card border border-hfc-border flex items-center justify-center">
              <Clock size={24} className="text-hfc-muted" />
            </div>
            <p className="font-display font-bold text-white">No rides yet</p>
            <p className="text-hfc-muted text-sm font-body">
              {search ? "No rides match your search." : "Your ride history will appear here."}
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-hfc-lime text-sm font-body hover:underline"
            >
              Request your first ride →
            </button>
          </div>
        )}

        {/* Rides list */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            <p className="text-hfc-muted text-xs font-body">
              {filtered.length} ride{filtered.length !== 1 ? "s" : ""}
            </p>
            {filtered.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                onClick={() => {
                  if (["REQUESTED", "ASSIGNED", "IN_PROGRESS"].includes(ride.status)) {
                    router.push(`/ride?id=${ride.id}`);
                  } else {
                    router.push(`/history/${ride.id}`);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
