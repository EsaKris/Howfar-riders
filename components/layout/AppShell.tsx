"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, User, ArrowLeft, Bike } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/dashboard", icon: Home,  label: "Home"    },
  { href: "/request",   icon: Bike,  label: "Rides"   },
  { href: "/history",   icon: Clock, label: "History" },
  { href: "/profile",   icon: User,  label: "Profile" },
];

interface AppShellProps {
  children:    React.ReactNode;
  title?:      string;
  backHref?:   string;
  rightSlot?:  React.ReactNode;
  hideNav?:    boolean;
}

export default function AppShell({
  children,
  title,
  backHref,
  rightSlot,
  hideNav = false,
}: AppShellProps) {
  const pathname  = usePathname();
  const { user }  = useAuth();

  return (
    <div className="min-h-screen bg-hfc-black flex flex-col max-w-md mx-auto relative">

      {/* ── Top header ─────────────────────────────────── */}
      {title !== undefined && (
        <header className="sticky top-0 z-40 bg-hfc-black/95 backdrop-blur border-b border-hfc-border px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {backHref ? (
              <Link href={backHref} className="text-hfc-muted hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
            ) : (
              /* HFC logo pill */
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-7 h-7 bg-hfc-lime rounded-lg flex items-center justify-center">
                  <span className="font-display font-black text-hfc-black text-xs">HFC</span>
                </div>
              </Link>
            )}
            {title && (
              <h1 className="font-display font-bold text-white text-base truncate">{title}</h1>
            )}
          </div>
          {rightSlot && <div>{rightSlot}</div>}
        </header>
      )}

      {/* ── Page content ───────────────────────────────── */}
      <main className={clsx("flex-1 overflow-y-auto", !hideNav && "pb-20")}>
        {children}
      </main>

      {/* ── Bottom navigation ──────────────────────────── */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-hfc-dark/95 backdrop-blur border-t border-hfc-border">
          <div className="flex">
            {navItems.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors",
                    active ? "text-hfc-lime" : "text-hfc-muted hover:text-white"
                  )}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
                  <span className={clsx("text-[10px] font-body font-medium", active && "font-bold")}>
                    {label}
                  </span>
                  {active && (
                    <span className="absolute bottom-0 w-8 h-0.5 bg-hfc-lime rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
          {/* Safe area padding for iPhones */}
          <div className="h-safe-area-inset-bottom" />
        </nav>
      )}
    </div>
  );
}
