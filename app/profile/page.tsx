"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { User, Mail, Phone, LogOut, Edit2, Save, X } from "lucide-react";
import { authApi, getApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/layout/AppShell";
import { Input } from "@/components/ui/index";
import Button from "@/components/ui/Button";
import Cookies from "js-cookie";

type FormValues = {
  full_name: string;
  email:     string;
};

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [apiError,  setApiError]  = useState("");
  const [success,   setSuccess]   = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { full_name: user?.full_name ?? "", email: user?.email ?? "" },
  });

  const onSave = async (data: FormValues) => {
    setSaving(true);
    setApiError("");
    setSuccess(false);
    try {
      await authApi.updateProfile(data);
      await refreshUser();
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setApiError(getApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    Cookies.remove("hfc_logged_in");
    await logout();
  };

  const cancelEdit = () => {
    reset({ full_name: user?.full_name ?? "", email: user?.email ?? "" });
    setEditing(false);
    setApiError("");
  };

  return (
    <AppShell title="Profile">
      <div className="px-5 py-5 space-y-5 page-enter">

        {/* Avatar + name */}
        <div className="flex flex-col items-center py-6 space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-hfc-lime/10 border border-hfc-lime/30 flex items-center justify-center font-display font-black text-hfc-lime text-3xl">
            {user?.full_name?.[0] ?? "?"}
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-white text-xl">{user?.full_name}</p>
            <p className="text-hfc-muted text-sm font-body">{user?.phone_number}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hfc-lime/10 border border-hfc-lime/20 text-hfc-lime text-xs font-medium">
            ✓ Verified Rider
          </span>
        </div>

        {/* Success banner */}
        {success && (
          <div className="bg-hfc-green/10 border border-hfc-green/30 text-hfc-green rounded-2xl px-4 py-3 text-sm font-body">
            ✅ Profile updated successfully.
          </div>
        )}

        {/* Edit form */}
        <div className="bg-hfc-card border border-hfc-border rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-white">Personal Info</h3>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-hfc-lime text-xs hover:text-white transition-colors font-body"
              >
                <Edit2 size={12} /> Edit
              </button>
            ) : (
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1.5 text-hfc-muted text-xs hover:text-white transition-colors font-body"
              >
                <X size={12} /> Cancel
              </button>
            )}
          </div>

          {!editing ? (
            /* Read-only view */
            <div className="space-y-4">
              {[
                { icon: User,  label: "Full Name",    value: user?.full_name   },
                { icon: Mail,  label: "Email",        value: user?.email       },
                { icon: Phone, label: "Phone",        value: user?.phone_number },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-hfc-dark border border-hfc-border flex items-center justify-center text-hfc-muted flex-shrink-0">
                    <Icon size={14} />
                  </div>
                  <div>
                    <p className="text-hfc-muted text-xs font-body">{label}</p>
                    <p className="text-white text-sm font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Edit form */
            <form onSubmit={handleSubmit(onSave)} className="space-y-4">
              <Input
                label="Full Name"
                leftIcon={<User size={14} />}
                error={errors.full_name?.message}
                {...register("full_name", { required: "Full name is required" })}
              />
              <Input
                type="email"
                label="Email Address"
                leftIcon={<Mail size={14} />}
                error={errors.email?.message}
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
                })}
              />
              <div className="bg-hfc-dark border border-hfc-border rounded-2xl px-4 py-3 flex items-center gap-3 opacity-60">
                <Phone size={14} className="text-hfc-muted flex-shrink-0" />
                <div>
                  <p className="text-hfc-muted text-xs font-body">Phone Number</p>
                  <p className="text-white text-sm">{user?.phone_number}</p>
                </div>
              </div>
              <p className="text-hfc-muted text-xs font-body">Phone number cannot be changed.</p>

              {apiError && (
                <p className="text-hfc-red text-sm font-body">{apiError}</p>
              )}
              <Button type="submit" loading={saving} fullWidth>
                <Save size={14} /> Save Changes
              </Button>
            </form>
          )}
        </div>

        {/* Account info */}
        <div className="bg-hfc-card border border-hfc-border rounded-3xl p-5">
          <h3 className="font-display font-bold text-white text-sm mb-4">Account</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-hfc-muted font-body">Account type</span>
              <span className="text-white font-medium capitalize">{user?.role?.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-hfc-muted font-body">Status</span>
              <span className="text-hfc-green font-medium">Active</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-hfc-muted font-body">Member since</span>
              <span className="text-white font-medium">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="danger"
          fullWidth
          loading={loggingOut}
          onClick={handleLogout}
        >
          <LogOut size={16} /> Sign Out
        </Button>

        <p className="text-center text-hfc-muted text-xs font-body pb-2">
          HFC Rider App · Makurdi 🇳🇬
        </p>
      </div>
    </AppShell>
  );
}
