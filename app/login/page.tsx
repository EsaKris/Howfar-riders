"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Phone, ArrowRight } from "lucide-react";
import { authApi, getApiError } from "@/lib/api";
import { Input } from "@/components/ui/index";
import Button from "@/components/ui/Button";
import Image from "next/image";

type FormValues = { phone_number: string };

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [loading,   setLoading]   = useState(false);
  const [apiError,  setApiError]  = useState("");
  const [showBanner, setShowBanner] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>();

  useEffect(() => {
    // Pre-fill phone if redirected from registration
    const phone = searchParams.get("phone");
    if (phone) setValue("phone_number", phone);
    if (searchParams.get("registered")) setShowBanner(true);
  }, [searchParams, setValue]);

  const onSubmit = async ({ phone_number }: FormValues) => {
    setLoading(true);
    setApiError("");
    try {
      await authApi.requestOTP(phone_number);
      // Pass phone to verify page via URL param (safe — it's just a number)
      router.push(`/login/verify?phone=${encodeURIComponent(phone_number)}`);
    } catch (err) {
      setApiError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hfc-black flex flex-col justify-between px-6 py-10 max-w-md mx-auto">

      {/* Header */}
      <div className="pt-8 space-y-2">
        <div className="w-10 h-10 bg-hfc-black rounded-xl flex items-center justify-center mb-6">
          <div className="w-9 h-9 relative flex-shrink-0">
            <Image
              src="/img/logo.png"
              alt="Howfar Transport Company Logo"
              fill
              className="object-contain group-hover:scale-105 transition-transform"
              priority
            />
          </div>
        </div>
        <h1 className="font-display font-black text-3xl text-white">Welcome back</h1>
        <p className="font-body text-hfc-muted text-sm">
          New to Howfar Transport Company?{" "}
          <Link href="/register" className="text-hfc-lime hover:underline">Create an account</Link>
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col justify-center space-y-5 py-8">

        {showBanner && (
          <div className="bg-hfc-lime/10 border border-hfc-lime/30 text-hfc-lime rounded-2xl px-4 py-3 text-sm font-body animate-fade-in">
            ✅ Account created! Enter your phone number to log in.
          </div>
        )}

        <div className="space-y-2">
          <p className="text-hfc-light font-body text-sm">
            Enter your phone number and we'll send a one-time code to your registered email.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            type="tel"
            label="Phone Number"
            placeholder="+2348012345678"
            leftIcon={<Phone size={16} />}
            hint="We'll send an OTP to your registered email"
            error={errors.phone_number?.message}
            {...register("phone_number", {
              required: "Phone number is required",
              pattern: {
                value: /^\+?[0-9]{10,15}$/,
                message: "Enter a valid number with country code e.g. +234...",
              },
            })}
          />

          {apiError && (
            <div className="bg-hfc-red/10 border border-hfc-red/30 text-hfc-red rounded-2xl px-4 py-3 text-sm font-body">
              {apiError}
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg">
            Send OTP <ArrowRight size={16} />
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-hfc-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-hfc-black px-3 text-hfc-muted text-xs font-body">or</span>
          </div>
        </div>

        <Link
          href="/login/forgot"
          className="text-center text-hfc-muted text-sm hover:text-white transition-colors font-body"
        >
          Forgot your password?
        </Link>
      </div>

      <p className="text-center text-hfc-muted text-xs font-body">
        Rides in Makurdi · Always ₦500 · Safe & Fast
      </p>
    </div>
  );
}
