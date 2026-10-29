import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  LogOut,
  User,
  Lock,
  Loader2,
} from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";

import { supabase } from "@/integrations/supabase/client";
import { useProfile, useRefreshBanking } from "@/lib/banking";
import { inr } from "@/lib/formats";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      {
        title: "Profile & Security | Nexa Smart Banking",
      },
      {
        name: "description",
        content:
          "Update your Nexa profile, manage KYC details, tune daily transfer limits and change your password securely.",
      },
      {
        property: "og:title",
        content: "Profile & Security | Nexa Smart Banking",
      },
      {
        property: "og:description",
        content:
          "Your identity, limits and security in one place.",
      },
    ],
  }),

  component: ProfilePage,
});

function ProfilePage() {
  const { data: profile, isLoading } = useProfile();

  const refresh = useRefreshBanking();

  const { signOut } = useAuth();

  // -----------------------------
  // Form states
  // -----------------------------

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
  });

  const [daily, setDaily] = useState(100000);

  const [pwd, setPwd] = useState("");

  // Loading states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLimit, setSavingLimit] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // -----------------------------
  // Load profile data
  // -----------------------------

  useEffect(() => {
    if (!profile) return;

    setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
      city: profile.city ?? "",
    });

    setDaily(Number(profile.daily_limit ?? 100000));
  }, [profile]);

  // -----------------------------
  // Save personal profile
  // -----------------------------

  const saveProfile = async () => {
    if (!profile?.id) {
      toast.error("Profile not found");
      return;
    }

    setSavingProfile(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          phone: form.phone,
          address: form.address,
          city: form.city,
        })
        .eq("id", profile.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Profile updated successfully");

      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // -----------------------------
  // Save daily transfer limit
  // -----------------------------

  const saveLimit = async (value: number) => {
    if (!profile?.id) {
      toast.error("Profile not found");
      return;
    }

    setSavingLimit(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          daily_limit: value,
        })
        .eq("id", profile.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Daily limit set to ${inr(value)}`);

      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update daily limit"
      );
    } finally {
      setSavingLimit(false);
    }
  };

  // -----------------------------
  // Change password
  // -----------------------------

  const changePassword = async () => {
    if (!pwd.trim()) {
      toast.error("Please enter a new password");
      return;
    }

    if (pwd.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: pwd,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Password changed successfully");

      setPwd("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not change password"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // -----------------------------
  // Sign out
  // -----------------------------

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  // -----------------------------
  // Loading screen
  // -----------------------------

  if (isLoading) {
    return (
      <AppShell
        title="Profile"
        subtitle="Identity, limits and account security"
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Loading profile...
          </div>
        </div>
      </AppShell>
    );
  }

  // -----------------------------
  // No profile
  // -----------------------------

  if (!profile) {
    return (
      <AppShell
        title="Profile"
        subtitle="Identity, limits and account security"
      >
        <Card className="shadow-soft">
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Profile information could not be loaded.
            </p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  // -----------------------------
  // Main UI
  // -----------------------------

  return (
    <AppShell
      title="Profile"
      subtitle="Identity, limits and account security"
    >
      <div className="grid gap-6 lg:grid-cols-3">

        {/* =========================================
            PERSONAL DETAILS
        ========================================= */}

        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="size-4" />
              Personal details
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            <div className="grid gap-4 sm:grid-cols-2">

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full-name">
                  Full name
                </Label>

                <Input
                  id="full-name"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      full_name: e.target.value,
                    })
                  }
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email
                </Label>

                <Input
                  id="email"
                  value={profile.email ?? ""}
                  disabled
                />
              </div>

              {/* Mobile */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Mobile
                </Label>

                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value,
                    })
                  }
                  placeholder="+91 98765 43210"
                />
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">
                  City
                </Label>

                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      city: e.target.value,
                    })
                  }
                  placeholder="Enter city"
                />
              </div>

              {/* Address */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">
                  Address
                </Label>

                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: e.target.value,
                    })
                  }
                  placeholder="Enter your address"
                />
              </div>
            </div>

            {/* Save Profile Button */}

            <Button
              onClick={saveProfile}
              disabled={savingProfile}
              className="gap-2"
            >
              {savingProfile && (
                <Loader2 className="size-4 animate-spin" />
              )}

              {savingProfile
                ? "Saving..."
                : "Save changes"}
            </Button>

            <Separator />

            {/* =====================================
                DAILY TRANSFER LIMIT
            ===================================== */}

            <div className="space-y-3">

              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  Daily transfer limit
                </span>

                <span className="tabular font-semibold">
                  {inr(daily)}
                </span>
              </div>

              <Slider
                value={[daily]}
                min={10000}
                max={1000000}
                step={10000}
                disabled={savingLimit}
                onValueChange={(value) => {
                  setDaily(value[0] ?? 10000);
                }}
                onValueCommit={(value) => {
                  saveLimit(value[0] ?? 10000);
                }}
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₹10,000</span>
                <span>₹10,00,000</span>
              </div>

              <p className="text-xs text-muted-foreground">
                Applies to all outgoing IMPS, NEFT, RTGS and UPI
                transfers.
              </p>

              {savingLimit && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Updating transfer limit...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* =========================================
            RIGHT SIDE
        ========================================= */}

        <div className="space-y-6">

          {/* =======================================
              KYC & IDENTITY
          ======================================= */}

          <Card className="shadow-soft">

            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4" />
                KYC & identity
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 pt-2 text-sm">

              {/* Customer ID */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">
                  Customer ID
                </span>

                <span className="font-mono text-xs font-semibold">
                  {profile.customer_id ?? "N/A"}
                </span>
              </div>

              {/* KYC */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  KYC status
                </span>

                <Badge className="bg-success/10 text-success hover:bg-success/10 capitalize">
                  {profile.kyc_status ?? "verified"}
                </Badge>
              </div>

              {/* Monthly Limit */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Monthly limit
                </span>

                <span className="tabular font-semibold">
                  {inr(profile.monthly_limit ?? 0)}
                </span>
              </div>

            </CardContent>
          </Card>

          {/* =======================================
              SECURITY
          ======================================= */}

          <Card className="shadow-soft">

            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="size-4" />
                Security
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 pt-2">

              {/* New Password */}

              <div className="space-y-2">
                <Label htmlFor="new-password">
                  New password
                </Label>

                <Input
                  id="new-password"
                  type="password"
                  value={pwd}
                  onChange={(e) =>
                    setPwd(e.target.value)
                  }
                  placeholder="Min 8 characters"
                />
              </div>

              {/* Update Password */}

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={changePassword}
                disabled={
                  changingPassword ||
                  pwd.length === 0
                }
              >
                {changingPassword && (
                  <Loader2 className="size-4 animate-spin" />
                )}

                {changingPassword
                  ? "Updating..."
                  : "Update password"}
              </Button>

              {/* Sign Out */}

              <Button
                variant="ghost"
                className="w-full gap-2"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}

                {signingOut
                  ? "Signing out..."
                  : "Sign out"}
              </Button>

            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}