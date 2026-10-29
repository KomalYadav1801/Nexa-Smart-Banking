import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, Loader2, TrendingDown, TrendingUp, Target } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/lib/banking";
import { inr, categoryLabel } from "@/lib/formats";
import { generateInsights } from "@/lib/insights.functions";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "AI Money Insights | Nexa Smart Banking" },
      {
        name: "description",
        content:
          "Nexa's AI money coach analyses 90 days of spending to score your financial health and suggest concrete savings actions.",
      },
      { property: "og:title", content: "AI Money Insights | Nexa Smart Banking" },
      { property: "og:description", content: "A personal AI money coach for your accounts." },
    ],
  }),
  component: InsightsPage,
});

type Result = {
  summary: string;
  health_score: number;
  insights: { title: string; detail: string; impact: string }[];
  actions: string[];
};

function InsightsPage() {
  const { data: txns } = useTransactions(400);
  const run = useServerFn(generateInsights);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const stats = useMemo(() => {
    const since = Date.now() - 90 * 24 * 3600 * 1000;
    const list = (txns ?? []).filter((t) => new Date(t.created_at).getTime() >= since);
    const income = list.filter((t) => t.direction === "credit").reduce((s, t) => s + Number(t.amount), 0);
    const spend = list.filter((t) => t.direction === "debit").reduce((s, t) => s + Number(t.amount), 0);
    const byCat = new Map<string, number>();
    const byMerchant = new Map<string, number>();
    for (const t of list) {
      if (t.direction !== "debit") continue;
      byCat.set(t.category, (byCat.get(t.category) ?? 0) + Number(t.amount));
      const m = t.counterparty ?? t.description;
      byMerchant.set(m, (byMerchant.get(m) ?? 0) + Number(t.amount));
    }
    const categories = [...byCat.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
    const topMerchants = [...byMerchant.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    return { income, spend, net: income - spend, categories, topMerchants };
  }, [txns]);

  const radar = stats.categories.slice(0, 6).map((c) => ({
    category: categoryLabel(c.category),
    amount: Math.round(c.amount),
  }));

  const analyse = async () => {
    setLoading(true);
    try {
      const res = await run({
        data: {
          totals: { income: stats.income, spend: stats.spend, net: stats.net },
          categories: stats.categories.slice(0, 8),
          topMerchants: stats.topMerchants,
        },
      });
      setResult(res as Result);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const savingsRate = stats.income > 0 ? Math.round((stats.net / stats.income) * 100) : 0;

  return (
    <AppShell title="AI Insights" subtitle="Your personal money coach, powered by AI">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-soft">
            <CardContent className="flex items-center gap-3 p-5">
              <div className="bg-success/10 text-success flex size-10 items-center justify-center rounded-xl">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Inflow (90d)</p>
                <p className="tabular text-xl font-bold">{inr(stats.income)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="flex items-center gap-3 p-5">
              <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <TrendingDown className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Outflow (90d)</p>
                <p className="tabular text-xl font-bold">{inr(stats.spend)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-5">
              <p className="text-muted-foreground text-xs">Savings rate</p>
              <p className="tabular text-xl font-bold">{savingsRate}%</p>
              <Progress value={Math.max(0, Math.min(100, savingsRate))} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-soft lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Spend footprint</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radar} outerRadius="70%">
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <Radar
                    dataKey="amount"
                    stroke="var(--color-primary)"
                    fill="var(--color-primary)"
                    fillOpacity={0.25}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-soft lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="text-primary size-4" /> Nexa AI coach
              </CardTitle>
              <Button onClick={analyse} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {result ? "Re-analyse" : "Analyse my money"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              )}

              {!loading && !result && (
                <p className="text-muted-foreground text-sm">
                  Run an analysis to get a financial health score, spending patterns and tailored
                  actions based on your last 90 days of activity.
                </p>
              )}

              {result && !loading && (
                <>
                  <div className="bg-secondary rounded-xl p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">Financial health score</p>
                      <span className="font-display text-2xl font-bold">
                        {result.health_score}/100
                      </span>
                    </div>
                    <Progress value={result.health_score} className="h-2" />
                    <p className="text-muted-foreground mt-3 text-sm">{result.summary}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {result.insights.map((i) => (
                      <div key={i.title} className="rounded-xl border p-4">
                        <div className="mb-1 flex items-center gap-2">
                          <p className="text-sm font-semibold">{i.title}</p>
                          <Badge variant="secondary" className="capitalize">
                            {i.impact}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed">{i.detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Target className="size-4" /> Recommended actions
                    </p>
                    {result.actions.map((a) => (
                      <div key={a} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                        <span className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" />
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
