import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  Lock,
  Fingerprint,
  Loader2,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { BrandMark } from "@/components/app/AppShell";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      {
        title: "Secure Login | Nexa Smart Banking",
      },
      {
        name: "description",
        content:
          "Sign in to Nexa Smart Banking to manage accounts, transfer money, pay bills and track spending securely.",
      },
    ],
  }),

  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // --------------------------------------------------
  // IF USER IS ALREADY LOGGED IN
  // --------------------------------------------------

  useEffect(() => {
    if (!authLoading && user) {
      void navigate({
        to: "/dashboard",
        replace: true,
      });
    }
  }, [
    authLoading,
    user,
    navigate,
  ]);

  // --------------------------------------------------
  // SIGN IN
  // --------------------------------------------------

  const signIn = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (busy) return;

    setBusy(true);

    try {
      const cleanEmail = email.trim();

      if (!cleanEmail || !password) {
        toast.error(
          "Please enter your email and password."
        );

        return;
      }

      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (error) {
        throw error;
      }

      if (!data.user || !data.session) {
        throw new Error(
          "Login completed but no active session was created."
        );
      }

      // Make sure banking profile/setup exists
      const {
        error: setupError,
      } = await supabase.rpc(
        "ensure_user_setup",
        {
          _full_name:
            data.user.user_metadata
              ?.full_name ||
            cleanEmail.split("@")[0] ||
            "Nexa Customer",
        },
      );

      if (setupError) {
        console.error(
          "ensure_user_setup error:",
          setupError
        );
      }

      toast.success(
        "Welcome back to Nexa Smart Banking!"
      );

      // Give Supabase a moment to persist session
      await new Promise((resolve) =>
        setTimeout(resolve, 150)
      );

      await navigate({
        to: "/dashboard",
        replace: true,
      });

    } catch (error: unknown) {
      console.error(
        "Sign in error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign in.";

      toast.error(message);

    } finally {
      setBusy(false);
    }
  };

  // --------------------------------------------------
  // SIGN UP
  // --------------------------------------------------

  const signUp = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (busy) return;

    setBusy(true);

    try {
      const cleanEmail =
        email.trim();

      const cleanName =
        fullName.trim();

      if (!cleanName) {
        toast.error(
          "Please enter your full name."
        );

        return;
      }

      if (!cleanEmail) {
        toast.error(
          "Please enter your email."
        );

        return;
      }

      if (password.length < 6) {
        toast.error(
          "Password must be at least 6 characters."
        );

        return;
      }

      // ----------------------------------------------
      // CREATE SUPABASE ACCOUNT
      // ----------------------------------------------

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanName,
            },

            emailRedirectTo:
              `${window.location.origin}/dashboard`,
          },
        });

      if (error) {
        throw error;
      }

      // ----------------------------------------------
      // IMPORTANT
      // ----------------------------------------------

      if (!data.user) {
        throw new Error(
          "Account could not be created."
        );
      }

      // ----------------------------------------------
      // CASE 1:
      // SESSION CREATED
      //
      // This happens when email confirmation
      // is disabled.
      // ----------------------------------------------

      if (data.session) {

        // Create banking data
        const {
          error: setupError,
        } = await supabase.rpc(
          "ensure_user_setup",
          {
            _full_name:
              cleanName ||
              cleanEmail.split("@")[0] ||
              "Nexa Customer",
          },
        );

        if (setupError) {
          console.error(
            "User setup error:",
            setupError
          );
        }

        toast.success(
          "Account created successfully! Opening your dashboard..."
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 300)
        );

        await navigate({
          to: "/dashboard",
          replace: true,
        });

        return;
      }

      // ----------------------------------------------
      // CASE 2:
      // EMAIL CONFIRMATION REQUIRED
      // ----------------------------------------------

      toast.success(
        "Account created! Please confirm your email before signing in."
      );

      // Switch back to Sign In tab naturally
      setPassword("");

    } catch (error: unknown) {
      console.error(
        "Sign up error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to create your account.";

      toast.error(message);

    } finally {
      setBusy(false);
    }
  };

  // --------------------------------------------------
  // GOOGLE LOGIN
  // --------------------------------------------------

  const google = async () => {
    toast.info(
      "Google login is currently disabled for this demo."
    );
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="grid min-h-screen lg:grid-cols-2">

      {/* ==========================================
          LEFT SIDE
      ========================================== */}

      <div className="bg-gradient-navy relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">

        <div className="bg-gradient-mesh absolute inset-0 opacity-70" />

        <div className="relative">

          <Link to="/">
            <BrandMark light />
          </Link>

        </div>

        <div className="relative space-y-6">

          <h2 className="text-navy-foreground max-w-md text-4xl leading-tight font-bold">
            Banking that thinks ahead of you.
          </h2>

          <p className="text-navy-foreground/70 max-w-md">
            Real-time balances, instant
            IMPS/NEFT/UPI transfers, smart
            card controls, bill autopay and
            AI-powered spend insights — all
            in one secure console.
          </p>

          <div className="text-navy-foreground/80 grid gap-3 text-sm">

            <div className="flex items-center gap-3">
              <ShieldCheck className="text-primary-glow size-4" />
              Bank-grade row-level data isolation
            </div>

            <div className="flex items-center gap-3">
              <Lock className="text-primary-glow size-4" />
              Server-verified money movement with limits
            </div>

            <div className="flex items-center gap-3">
              <Fingerprint className="text-primary-glow size-4" />
              Realtime alerts on every debit
            </div>

          </div>

        </div>

        <p className="text-navy-foreground/40 relative text-xs">
          © {new Date().getFullYear()} Nexa Smart Banking.
          Demo project.
        </p>

      </div>

      {/* ==========================================
          RIGHT SIDE
      ========================================== */}

      <div className="flex items-center justify-center p-6">

        <Card className="shadow-elevated w-full max-w-md border-none">

          <CardContent className="p-6 sm:p-8">

            <div className="mb-6 lg:hidden">
              <BrandMark />
            </div>

            <h1 className="font-display text-2xl font-bold">
              Net Banking Login
            </h1>

            <p className="text-muted-foreground mt-1 text-sm">
              Access your accounts securely, 24×7.
            </p>

            <Tabs
              defaultValue="signin"
              className="mt-6"
            >

              <TabsList className="grid w-full grid-cols-2">

                <TabsTrigger value="signin">
                  Sign in
                </TabsTrigger>

                <TabsTrigger value="signup">
                  Open account
                </TabsTrigger>

              </TabsList>

              {/* ====================================
                  SIGN IN
              ==================================== */}

              <TabsContent value="signin">

                <form
                  onSubmit={signIn}
                  className="space-y-4 pt-4"
                >

                  <div className="space-y-2">

                    <Label htmlFor="login-email">
                      Registered email
                    </Label>

                    <Input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="you@example.com"
                    />

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="login-password">
                      Password
                    </Label>

                    <Input
                      id="login-password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="••••••••"
                    />

                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      busy ||
                      authLoading
                    }
                  >

                    {busy && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}

                    {busy
                      ? "Signing in..."
                      : "Secure sign in"}

                  </Button>

                </form>

              </TabsContent>

              {/* ====================================
                  SIGN UP
              ==================================== */}

              <TabsContent value="signup">

                <form
                  onSubmit={signUp}
                  className="space-y-4 pt-4"
                >

                  <div className="space-y-2">

                    <Label htmlFor="signup-name">
                      Full name
                    </Label>

                    <Input
                      id="signup-name"
                      required
                      value={fullName}
                      onChange={(e) =>
                        setFullName(e.target.value)
                      }
                      placeholder="Your full name"
                    />

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="signup-email">
                      Email
                    </Label>

                    <Input
                      id="signup-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="you@example.com"
                    />

                  </div>

                  <div className="space-y-2">

                    <Label htmlFor="signup-password">
                      Create password
                    </Label>

                    <Input
                      id="signup-password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Minimum 6 characters"
                    />

                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={busy}
                  >

                    {busy && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}

                    {busy
                      ? "Creating account..."
                      : "Open my Nexa account"}

                  </Button>

                </form>

              </TabsContent>

            </Tabs>

            <div className="text-muted-foreground my-5 flex items-center gap-3 text-xs">

              <span className="bg-border h-px flex-1" />

              OR

              <span className="bg-border h-px flex-1" />

            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={google}
              disabled={busy}
            >
              Continue with Google
            </Button>

            <p className="text-muted-foreground mt-6 text-center text-xs">
              Protected by encryption and row-level
              security. Never share your OTP.
            </p>

          </CardContent>

        </Card>

      </div>

    </div>
  );
}