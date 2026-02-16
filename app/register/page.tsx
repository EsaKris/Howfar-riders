"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { User, Mail, Phone, ArrowRight } from "lucide-react";
import { authApi, getApiError } from "@/lib/api";
import { Input } from "@/components/ui/index";
import Button from "@/components/ui/Button";
import Image from "next/image";

type FormValues = {
  full_name:    string;
  email:        string;
  phone_number: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setApiError("");
    try {
      await authApi.register(data);
      // After registration, send them to login with their phone pre-filled
      router.push(`/login?phone=${encodeURIComponent(data.phone_number)}&registered=1`);
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
        <h1 className="font-display font-black text-3xl text-white">Create account</h1>
        <p className="font-body text-hfc-muted text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-hfc-lime hover:underline">Sign in</Link>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col justify-center space-y-5 py-8">

        <Input
          label="Full Name"
          placeholder="e.g. Amaka Okafor"
          leftIcon={<User size={16} />}
          error={errors.full_name?.message}
          {...register("full_name", { required: "Full name is required" })}
        />

        <Input
          type="email"
          label="Email Address"
          placeholder="amaka@gmail.com"
          leftIcon={<Mail size={16} />}
          error={errors.email?.message}
          {...register("email", {
            required: "Email is required",
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
          })}
        />

        <Input
          type="tel"
          label="Phone Number"
          placeholder="+2348012345678"
          leftIcon={<Phone size={16} />}
          hint="This is what you'll use to log in"
          error={errors.phone_number?.message}
          {...register("phone_number", {
            required: "Phone number is required",
            pattern: {
              value: /^\+?[0-9]{10,15}$/,
              message: "Enter a valid phone number with country code e.g. +234...",
            },
          })}
        />

        {apiError && (
          <div className="bg-hfc-red/10 border border-hfc-red/30 text-hfc-red rounded-2xl px-4 py-3 text-sm font-body">
            {apiError}
          </div>
        )}

        <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
          Create Account <ArrowRight size={16} />
        </Button>
      </form>

      <p className="text-center text-hfc-muted text-xs font-body">
        By creating an account you agree to our{" "}
        <Link href="https://howfar.ng/terms" className="text-hfc-lime hover:underline">Terms of Service</Link>
        {" "}and{" "}
        <Link href="https://howfar.ng/privacy" className="text-hfc-lime hover:underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}
