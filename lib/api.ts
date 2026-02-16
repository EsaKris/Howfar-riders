import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import {
  getAccessToken, getRefreshToken,
  saveTokens, clearAuth,
} from "@/lib/tokens";
import type {
  LoginRequestResponse, VerifyOTPResponse, RegisterResponse,
  User, Ride, RideRequestPayload, PaginatedResponse,
} from "@/types";

// ── Axios instance ────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api-howfartransports.onrender.com/";

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ── Request interceptor — attach JWT ─────────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — auto-refresh on 401 ───────────────────────────

// List of endpoints that should never trigger refresh
const AUTH_EXCLUDE = [
  "/auth/login/",
  "/auth/verify-otp/",
  "/auth/register/",
  "/auth/token/refresh/",
];

// Extend Axios config type to include _retry flag
interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as RetryConfig;

    const isAuthRoute = AUTH_EXCLUDE.some((path) =>
      original.url?.includes(path)
    );

    // Only refresh if 401, not retried yet, and not an auth route
    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers!["Authorization"] = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;
      const refresh = getRefreshToken();

      if (!refresh) {
        clearAuth();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, {
          refresh,
        });
        saveTokens({ access: data.access, refresh: data.refresh ?? refresh });
        processQueue(null, data.access);
        original.headers!["Authorization"] = `Bearer ${data.access}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        clearAuth();
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth endpoints ────────────────────────────────────────────────────────

export const authApi = {
  requestOTP: (phone_number: string) =>
    api.post<LoginRequestResponse>("/auth/login/", { phone_number }),

  verifyOTP: (phone_number: string, otp: string) =>
    api.post<VerifyOTPResponse>("/auth/verify-otp/", { phone_number, otp }),

  register: (data: { full_name: string; email: string; phone_number: string }) =>
    api.post<RegisterResponse>("/auth/register/", data),

  me: () => {
    const token = getAccessToken();
    if (!token) return Promise.reject("No access token"); // prevent 401 spam
    return api.get<User>("/auth/me/");
  },

  updateProfile: (data: Partial<Pick<User, "full_name" | "email">>) =>
    api.patch<User>("/auth/me/", data),

  logout: (refresh: string) =>
    api.post("/auth/logout/", { refresh }),

  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password/", { email }),

  resetPassword: (email: string, otp: string, new_password: string, confirm_password: string) =>
    api.post("/auth/reset-password/", { email, otp, new_password, confirm_password }),
};

// ── Ride endpoints ────────────────────────────────────────────────────────

export const rideApi = {
  request: (data: RideRequestPayload) =>
    api.post<{ message: string; ride: Ride }>("/rides/request/", data),

  history: (status?: string) =>
    api.get<PaginatedResponse<Ride>>("/rides/history/", {
      params: status ? { status } : {},
    }),

  detail: (rideId: string) =>
    api.get<Ride>(`/rides/${rideId}/`),

  cancel: (rideId: string, cancellation_reason?: string) =>
    api.post<{ message: string; ride: Ride }>(`/rides/${rideId}/cancel/`, {
      cancellation_reason: cancellation_reason ?? "",
    }),
};

// ── Helper: extract error message ────────────────────────────────────────

export function getApiError(err: unknown): string {
  const e = err as {
    response?: { data?: { message?: string; detail?: string } };
    message?: string;
  };
  return (
    e?.response?.data?.message ||
    e?.response?.data?.detail ||
    e?.message ||
    "Something went wrong. Please try again."
  );
}
