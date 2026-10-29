import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  CreditCard,
  PiggyBank,
  Receipt,
  LineChart,
  Lock,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeSwitcher } from "@/components/app/ThemeSwitcher";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexa Smart Banking — Net Banking, Reimagined" },
      {
        name: "description",
        content:
          "Nexa Smart Banking gives you instant transfers, real-time card controls, BBPS bill pay, deposits and an AI money coach in one secure dashboard.",
      },
      { property: "og:title", content: "Nexa Smart Banking — Net Banking, Reimagined" },
      {
        property: "og:description",
        content: "Instant transfers, card controls, bill pay, deposits and AI money insights.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Zap,
    title: "Instant transfers",
    text: "UPI, IMPS, NEFT and RTGS with OTP verification, live limits and instant receipts.",
  },
  {
    icon: CreditCard,
    title: "Real-time card controls",
    text: "Freeze a card in one tap, set ATM and POS limits, toggle online and international use.",
  },
  {
    icon: Receipt,
    title: "BBPS bill desk",
    text: "Electricity, broadband, gas and more — pay dues or switch on autopay in seconds.",
  },
  {
    icon: PiggyBank,
    title: "Deposits & goals",
    text: "Book FDs and RDs with a live compounded maturity calculator and growth projection.",
  },
  {
    icon: LineChart,
    title: "Deep statements",
    text: "Search, filter by category, date and mode, then export a clean CSV statement.",
  },
  {
    icon: Sparkles,
    title: "AI money coach",
    text: "A financial health score with tailored actions generated from your real spending.",
  },
];

function Landing() {
  return (
    <div className="bg-background min-h-screen">
      <header className="border-border/60 sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-brand text-primary-foreground flex size-9 items-center justify-center rounded-xl font-bold">
              N
            </div>
            <span className="font-display text-lg font-bold tracking-tight">Nexa</span>
          </div>
          <nav className="text-muted-foreground hidden gap-7 text-sm font-medium md:flex">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#security" className="hover:text-foreground transition-colors">
              Security
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">Open account</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="bg-gradient-mesh pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="secondary" className="mb-5 gap-1.5">
                <Sparkles className="size-3" /> Now with an AI money coach
              </Badge>
              <h1 className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight md:text-6xl">
                Net banking,
                <br />
                <span className="text-primary">reimagined.</span>
              </h1>
              <p className="text-muted-foreground mt-5 max-w-lg text-base leading-relaxed md:text-lg">
                Move money in seconds, control every card in real time, pay bills, grow deposits and
                let Nexa's AI tell you exactly where your money goes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/auth">
                    Get started free <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/auth">Explore the demo</Link>
                </Button>
              </div>
              <div className="text-muted-foreground mt-8 flex flex-wrap gap-6 text-xs">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="text-success size-4" /> 256-bit encryption
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="text-success size-4" /> Row-level data isolation
                </span>
                <span className="flex items-center gap-1.5">
                  <Smartphone className="text-success size-4" /> Works on every device
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-card-premium shadow-elevated relative aspect-[1.6/1] w-full overflow-hidden rounded-3xl p-7">
                <div className="bg-gradient-mesh absolute inset-0 opacity-70" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-navy-foreground/60 text-[10px] tracking-[0.25em] uppercase">
                        Nexa Platinum
                      </p>
                      <p className="text-navy-foreground font-display text-lg font-bold">
                        Smart Banking
                      </p>
                    </div>
                    <div className="bg-navy-foreground/10 text-navy-foreground rounded-full px-3 py-1 text-[10px]">
                      Live
                    </div>
                  </div>
                  <div>
                    <p className="text-navy-foreground/50 text-[10px] uppercase">
                      Available balance
                    </p>
                    <p className="text-navy-foreground font-display text-3xl font-extrabold">
                      ₹ 8,42,150.00
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ["Sent", "₹1.2L"],
                      ["Received", "₹3.4L"],
                      ["Saved", "₹86K"],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-navy-foreground/10 rounded-xl px-3 py-2">
                        <p className="text-navy-foreground/60 text-[10px]">{k}</p>
                        <p className="text-navy-foreground text-sm font-bold">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Everything a modern bank should do
        </h2>
        <p className="text-muted-foreground mt-3 max-w-xl">
          Built end to end — real accounts, real balances, atomic transfers and a live database
          behind every screen.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="shadow-soft hover:shadow-elevated transition-shadow">
              <CardContent className="p-6">
                <div className="bg-secondary text-primary mb-4 flex size-11 items-center justify-center rounded-xl">
                  <f.icon className="size-5" />
                </div>
                <p className="font-display font-bold">{f.title}</p>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{f.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="security" className="bg-secondary/50 border-y">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-3 md:py-20">
          {[
            ["Bank-grade security", "Every table is protected with row-level policies so your data is only ever yours."],
            ["Atomic money movement", "Transfers run as a single server-side transaction with balance and limit checks."],
            ["Audit-ready records", "Every debit and credit is written with a reference, running balance and timestamp."],
          ].map(([t, d]) => (
            <div key={t}>
              <ShieldCheck className="text-primary mb-3 size-6" />
              <p className="font-display font-bold">{t}</p>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Open your Nexa account in under a minute
        </h2>
        <p className="text-muted-foreground mx-auto mt-3 max-w-md">
          Sign up and your accounts, cards, billers and statement history are provisioned instantly.
        </p>
        <Button asChild size="lg" className="mt-7 gap-2">
          <Link to="/auth">
            Create your account <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} Nexa Smart Banking. Demo project.</p>
          <p>Built with React, TanStack Start and a live cloud database.</p>
        </div>
      </footer>
    </div>
  );
}
