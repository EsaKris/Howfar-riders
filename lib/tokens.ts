import type { AuthTokens, User } from "@/types";

const ACCESS_KEY  = "hfc_access";
const REFRESH_KEY = "hfc_refresh";
const USER_KEY    = "hfc_user";

// ── Save ──────────────────────────────────────────────────────────────────

export function saveTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY,  tokens.access);
  localStorage.setItem(REFRESH_KEY, tokens.refresh);
}

export function saveUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ── Read ──────────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

// ── Clear ─────────────────────────────────────────────────────────────────

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Check ─────────────────────────────────────────────────────────────────

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
