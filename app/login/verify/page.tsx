"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, RefreshCw } from "lucide-react";
import { authApi, getApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { OTPInput } from "@/components/ui/index";
import Button from "@/components/ui/Button";
import Cookies from "js-cookie";

const OTP_EXPIRY_SECONDS = 600; // 10 minutes

export default function VerifyOTPPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login }    = useAuth();

  const phone     = searchParams.get("phone") ?? "";
  const maskedPhone = phone.slice(0, -4).replace(/\d/g, "*") + phone.slice(-4);

  const [otp,       setOtp]       = useState("");
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error,     setError]     = useState("");
  const [countdown, setCountdown] = useState(OTP_EXPIRY_SECONDS);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    if (otp.length === 6 && !loading) handleVerify(otp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleVerify = async (code: string) => {
    if (!phone) { setError("Phone number missing. Please go back."); return; }
    setLoading(true);
    setError("");
    try {
      const { data } = await authApi.verifyOTP(phone, code);

      // Store a lightweight session cookie for middleware
      Cookies.set("hfc_logged_in", "1", {
        expires: 90,          // 90 days — matches JWT refresh lifetime
        sameSite: "Strict",
      });

      // Store tokens + user in auth context (and localStorage)
      login(data.tokens, data.user);

      // Redirect to dashboard (or the page they originally tried to visit)
      const from = searchParams.get("from") ?? "/dashboard";
      router.replace(from);
    } catch (err) {
      setError(getApiError(err));
      setOtp(""); // Clear boxes on error
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !phone) return;
    setResending(true);
    setError("");
    try {
      await authApi.requestOTP(phone);
      setCountdown(OTP_EXPIRY_SECONDS);
      setCanResend(false);
      setOtp("");
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setResending(false);
    }
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="min-h-screen bg-hfc-black flex flex-col justify-between px-6 py-10 max-w-md mx-auto">

      {/* Header */}
      <div className="pt-8">
        <div className="w-10 h-10 bg-hfc-lime rounded-xl flex items-center justify-center mb-6">
          <span className="font-display font-black text-hfc-black text-sm">HFC</span>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-hfc-card border border-hfc-border flex items-center justify-center mb-5">
          <Mail size={24} className="text-hfc-lime" />
        </div>

        <h1 className="font-display font-black text-3xl text-white mb-2">
          Check your email
        </h1>
        <p className="font-body text-hfc-muted text-sm leading-relaxed">
          We sent a 6-digit code to the email linked to{" "}
          <span className="text-white font-medium">{maskedPhone}</span>.
          Enter it below to sign in.
        </p>
      </div>

      {/* OTP + actions */}
      <div className="flex-1 flex flex-col justify-center space-y-8 py-8">

        <OTPInput value={otp} onChange={setOtp} error={error} />

        {loading && (
          <p className="text-center text-hfc-muted text-sm font-body animate-pulse">
            Verifying…
          </p>
        )}

        {/* Manual submit (in case auto-submit doesn't fire) */}
        {otp.length === 6 && !loading && (
          <Button
            onClick={() => handleVerify(otp)}
            fullWidth
            size="lg"
          >
            Verify & Sign In
          </Button>
        )}

        {/* Timer + resend */}
        <div className="text-center space-y-2">
          {!canResend ? (
            <p className="text-hfc-muted text-sm font-body">
              Code expires in{" "}
              <span className="text-white font-medium tabular-nums">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
            </p>
          ) : (
            <Button
              variant="ghost"
              onClick={handleResend}
              loading={resending}
              className="text-hfc-lime hover:text-white"
            >
              <RefreshCw size={14} /> Resend code
            </Button>
          )}
        </div>

        <button
          onClick={() => router.back()}
          className="text-hfc-muted hover:text-white text-sm font-body text-center transition-colors"
        >
          ← Wrong phone number? Go back
        </button>
      </div>

      <p className="text-center text-hfc-muted text-xs font-body">
        Didn't get an email? Check your spam folder.
      </p>
    </div>
  );
}
