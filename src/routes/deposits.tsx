import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2, PiggyBank, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts, useDeposits, useOpenDeposit } from "@/lib/banking";
import { inr, shortDate, maskAccount } from "@/lib/formats";

export const Route = createFileRoute("/deposits")({
  head: () => ({
    meta: [
      { title: "Deposits & Goals | Nexa Smart Banking" },
      {
        name: "description",
        content:
          "Book fixed and recurring deposits, preview compounded maturity value and track goal progress on Nexa.",
      },
      {
        property: "og:title",
        content: "Deposits & Goals | Nexa Smart Banking",
      },
      {
        property: "og:description",
        content: "Grow savings with a live maturity calculator.",
      },
    ],
  }),
  component: DepositsPage,
});

/**
 * Supabase can return numeric fields as strings depending on the column type.
 * This helper prevents one malformed/null value from turning the whole card into NaN.
 */
function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    if (!cleaned) return fallback;

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function DepositsPage() {
  const {
    data: deposits,
    isLoading: depositsLoading,
    error: depositsError,
  } = useDeposits();

  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const openDeposit = useOpenDeposit();

  const [from, setFrom] = useState("");
  const [type, setType] = useState("FD");
  const [principal, setPrincipal] = useState("50000");
  const [tenure, setTenure] = useState(24);

  const source =
    (accounts ?? []).find((a) => a.id === from) ?? accounts?.[0];

  const rate = useMemo(
    () => (tenure >= 36 ? 7.6 : tenure >= 12 ? 7.25 : 6.5),
    [tenure],
  );

  const p = safeNumber(principal);

  const maturity = useMemo(() => {
    if (p <= 0) return 0;

    return p * Math.pow(1 + rate / 100 / 4, 4 * (tenure / 12));
  }, [p, rate, tenure]);

  const projection = useMemo(
    () =>
      Array.from(
        { length: Math.max(1, Math.round(tenure / 3)) },
        (_, i) => {
          const months = (i + 1) * 3;

          return {
            label: `${months}m`,
            value: Math.round(
              p * Math.pow(1 + rate / 100 / 4, 4 * (months / 12)),
            ),
          };
        },
      ),
    [p, rate, tenure],
  );

  const book = async () => {
    if (!source) {
      toast.error("Please select an account.");
      return;
    }

    if (!Number.isFinite(p) || p < 1000) {
      toast.error("Minimum deposit amount is ₹1,000.");
      return;
    }

    try {
      const res = await openDeposit.mutateAsync({
        from: source.id,
        principal: p,
        tenure,
        rate,
        type,
      });

      toast.success(
        `${type === "FD" ? "Fixed Deposit" : "Recurring Deposit"} booked · maturity ${inr(
          safeNumber(res?.maturity_amount),
        )}`,
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const invested = useMemo(
    () =>
      (deposits ?? []).reduce(
        (sum, d) => sum + safeNumber(d?.principal),
        0,
      ),
    [deposits],
  );

  const maturityTotal = useMemo(
    () =>
      (deposits ?? []).reduce(
        (sum, d) => sum + safeNumber(d?.maturity_amount),
        0,
      ),
    [deposits],
  );

  const interestTotal = Math.max(0, maturityTotal - invested);

  return (
    <AppShell
      title="Deposits"
      subtitle="Fixed & recurring deposits with live maturity projection"
    >
      <div className="space-y-6">
        {depositsError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-destructive">
                Unable to load deposits.
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {(depositsError as Error).message}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-soft">
            <CardContent className="flex items-center gap-3 p-5">
              <div className="bg-secondary text-primary flex size-10 items-center justify-center rounded-xl">
                <PiggyBank className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total invested</p>
                <p className="tabular text-xl font-bold">
                  {depositsLoading ? "—" : inr(invested)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="flex items-center gap-3 p-5">
              <div className="bg-success/10 text-success flex size-10 items-center justify-center rounded-xl">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">
                  Value at maturity
                </p>
                <p className="tabular text-xl font-bold">
                  {depositsLoading ? "—" : inr(maturityTotal)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-5">
              <p className="text-muted-foreground text-xs">
                Estimated interest earned
              </p>
              <p className="text-success tabular text-xl font-bold">
                {depositsLoading ? "—" : inr(interestTotal)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Book a new deposit</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Deposit type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FD">Fixed Deposit</SelectItem>
                      <SelectItem value="RD">Recurring Deposit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Debit from</Label>
                  <Select
                    value={source?.id ?? ""}
                    onValueChange={setFrom}
                    disabled={accountsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Account" />
                    </SelectTrigger>

                    <SelectContent>
                      {(accounts ?? []).map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.nickname} · {maskAccount(a.account_number)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  min="1000"
                  step="100"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className="tabular text-lg font-semibold"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Tenure</span>
                  <span className="font-semibold">
                    {tenure} months @ {rate}% p.a.
                  </span>
                </div>

                <Slider
                  value={[tenure]}
                  min={6}
                  max={60}
                  step={6}
                  onValueChange={(v) => setTenure(v[0] ?? 12)}
                />
              </div>

              <div className="bg-secondary rounded-xl p-4">
                <p className="text-muted-foreground text-xs">
                  Projected maturity value
                </p>

                <p className="tabular font-display text-2xl font-bold">
                  {inr(maturity)}
                </p>

                <p className="text-success mt-1 text-xs font-medium">
                  + {inr(Math.max(0, maturity - p))} interest (compounded
                  quarterly)
                </p>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={book}
                disabled={
                  openDeposit.isPending ||
                  !source ||
                  p < 1000 ||
                  !Number.isFinite(p)
                }
              >
                {openDeposit.isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Book {type}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Growth projection
                </CardTitle>
              </CardHeader>

              <CardContent className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projection}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      stroke="var(--color-muted-foreground)"
                    />

                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="var(--color-muted-foreground)"
                      tickFormatter={(v) => inr(v, true)}
                    />

                    <Tooltip
                      formatter={(v: number) => inr(safeNumber(v))}
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />

                    <Bar
                      dataKey="value"
                      fill="var(--color-chart-1)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Active deposits</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 pt-2">
                {(deposits ?? []).map((d) => {
                  const principalValue = safeNumber(d?.principal);
                  const maturityValue = safeNumber(d?.maturity_amount);

                  return (
                    <div
                      key={d.id}
                      className="flex items-center justify-between rounded-xl border p-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {inr(principalValue)}
                          </p>
                          <Badge variant="secondary">
                            {d.deposit_type === "FD"
                              ? "Fixed Deposit"
                              : d.deposit_type === "RD"
                                ? "Recurring Deposit"
                                : d.deposit_type}
                          </Badge>
                        </div>

                        <p className="text-muted-foreground text-xs">
                          {safeNumber(d.interest_rate)}% · matures{" "}
                          {d.maturity_date
                            ? shortDate(d.maturity_date)
                            : "—"}
                        </p>
                      </div>

                      <p className="text-success tabular text-sm font-semibold">
                        {inr(maturityValue)}
                      </p>
                    </div>
                  );
                })}

                {!depositsLoading && (deposits ?? []).length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    No deposits booked yet.
                  </p>
                )}

                {depositsLoading && (
                  <p className="text-muted-foreground text-sm">
                    Loading deposits…
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
