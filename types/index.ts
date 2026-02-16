// ── User / Auth ───────────────────────────────────────────────────────────

export type UserRole = "user" | "driver" | "pending_driver" | "admin";

export interface User {
  id:           string;
  email:        string;
  phone_number: string;
  full_name:    string;
  role:         UserRole;
  is_active:    boolean;
  created_at:   string;
  updated_at:   string;
}

export interface AuthTokens {
  access:  string;
  refresh: string;
}

export interface LoginRequestResponse {
  message: string;
}

export interface VerifyOTPResponse {
  message: string;
  tokens:  AuthTokens;
  user:    User;
}

export interface RegisterResponse {
  message: string;
  user:    Pick<User, "id" | "full_name" | "email" | "phone_number" | "role">;
}

// ── Ride ──────────────────────────────────────────────────────────────────

export type RideStatus =
  | "REQUESTED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface RiderSummary {
  id:           string;
  full_name:    string;
  phone_number: string;
}

export interface DriverSummary {
  id:           string;
  full_name:    string;
  phone_number: string;
  bike_plate:   string | null;
}

export interface RideStatusLog {
  id:              string;
  from_status:     string;
  to_status:       string;
  changed_by_name: string;
  note:            string;
  timestamp:       string;
}

export interface Ride {
  id:                   string;
  rider:                RiderSummary;
  driver:               DriverSummary | null;
  pickup_address:       string;
  pickup_lat:           string | null;
  pickup_lng:           string | null;
  dropoff_address:      string;
  dropoff_lat:          string | null;
  dropoff_lng:          string | null;
  price:                number;
  price_display:        string;
  status:               RideStatus;
  rider_notes:          string;
  cancellation_reason:  string;
  assigned_at:          string | null;
  started_at:           string | null;
  completed_at:         string | null;
  cancelled_at:         string | null;
  created_at:           string;
  updated_at:           string;
  status_logs:          RideStatusLog[];
}

export interface RideRequestPayload {
  pickup_address:  string;
  pickup_lat?:     number;
  pickup_lng?:     number;
  dropoff_address: string;
  dropoff_lat?:    number;
  dropoff_lng?:    number;
  rider_notes?:    string;
}

// ── API responses ─────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  T[];
}

export interface ApiError {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}
