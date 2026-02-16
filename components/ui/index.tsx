"use client";

import { forwardRef, type InputHTMLAttributes, useRef, type KeyboardEvent } from "react";
import clsx from "clsx";
import type { RideStatus } from "@/types";

// ── Input ─────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:    string;
  error?:    string;
  hint?:     string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, className, ...props }, ref) => (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-sm text-hfc-muted font-body font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-hfc-muted">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            "w-full bg-hfc-card border rounded-2xl px-4 py-3.5 text-white font-body text-sm",
            "placeholder-hfc-muted outline-none transition-all duration-200",
            "focus:border-hfc-lime/60 focus:ring-1 focus:ring-hfc-lime/20",
            error ? "border-hfc-red/50" : "border-hfc-border",
            leftIcon && "pl-11",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-hfc-red text-xs font-body">{error}</p>}
      {hint && !error && <p className="text-hfc-muted text-xs font-body">{hint}</p>}
    </div>
  )
);
Input.displayName = "Input";

// ── OTP Input — 6 individual boxes ───────────────────────────────────────

interface OTPInputProps {
  value:    string;
  onChange: (val: string) => void;
  error?:   string;
}

export function OTPInput({ value, onChange, error }: OTPInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  const handleChange = (index: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const arr = digits.map((d) => d);
    arr[index] = char;
    onChange(arr.join("").replace(/\s/g, ""));
    if (char && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3 justify-center">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={clsx(
              "w-12 h-14 text-center text-xl font-display font-bold text-white",
              "bg-hfc-card border rounded-2xl outline-none transition-all duration-200",
              "focus:border-hfc-lime focus:ring-1 focus:ring-hfc-lime/30",
              d ? "border-hfc-lime/40" : "border-hfc-border",
              error && "border-hfc-red/50"
            )}
          />
        ))}
      </div>
      {error && <p className="text-hfc-red text-xs text-center font-body">{error}</p>}
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────

const statusConfig: Record<RideStatus, { label: string; color: string }> = {
  REQUESTED:   { label: "Looking for driver",  color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  ASSIGNED:    { label: "Driver assigned",     color: "text-hfc-lime bg-hfc-lime/10 border-hfc-lime/20" },
  IN_PROGRESS: { label: "Ride in progress",    color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  COMPLETED:   { label: "Completed",           color: "text-hfc-green bg-hfc-green/10 border-hfc-green/20" },
  CANCELLED:   { label: "Cancelled",           color: "text-hfc-muted bg-hfc-muted/10 border-hfc-muted/20" },
};

export function StatusBadge({ status }: { status: RideStatus }) {
  const cfg = statusConfig[status];
  return (
    <span className={clsx(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border font-body",
      cfg.color
    )}>
      <span className={clsx(
        "w-1.5 h-1.5 rounded-full",
        status === "IN_PROGRESS" && "animate-pulse",
        status === "REQUESTED"   && "animate-pulse",
        cfg.color.split(" ")[0].replace("text-", "bg-")
      )} />
      {cfg.label}
    </span>
  );
}

// ── RideCard ──────────────────────────────────────────────────────────────

import type { Ride } from "@/types";
import { MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RideCardProps {
  ride:    Ride;
  onClick?: () => void;
}

export function RideCard({ ride, onClick }: RideCardProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full text-left bg-hfc-card border border-hfc-border rounded-3xl p-5 space-y-4",
        "hover:border-hfc-lime/30 transition-all duration-200 active:scale-[0.98]",
        onClick && "cursor-pointer"
      )}
    >
      {/* Status + time */}
      <div className="flex items-center justify-between">
        <StatusBadge status={ride.status} />
        <span className="text-hfc-muted text-xs font-body">
          {formatDistanceToNow(new Date(ride.created_at), { addSuffix: true })}
        </span>
      </div>

      {/* Route */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex flex-col items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-hfc-lime" />
            <div className="w-px h-6 bg-hfc-border" />
            <div className="w-2.5 h-2.5 rounded-full bg-hfc-orange" />
          </div>
          <div className="space-y-3 flex-1 min-w-0">
            <div>
              <p className="text-hfc-muted text-xs font-body">Pickup</p>
              <p className="text-white text-sm font-medium truncate">{ride.pickup_address}</p>
            </div>
            <div>
              <p className="text-hfc-muted text-xs font-body">Dropoff</p>
              <p className="text-white text-sm font-medium truncate">{ride.dropoff_address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-hfc-border">
        <span className="font-display font-bold text-hfc-lime text-lg">{ride.price_display}</span>
        {ride.driver && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-hfc-lime/10 border border-hfc-lime/30 flex items-center justify-center text-hfc-lime text-xs font-bold">
              {ride.driver.full_name[0]}
            </div>
            <span className="text-hfc-muted text-xs">{ride.driver.full_name}</span>
          </div>
        )}
      </div>
    </button>
  );
}
