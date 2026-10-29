import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  Wallet,
  TrendingUp,
  Receipt,
  ArrowLeftRight,
  CreditCard,
  PiggyBank,
} from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import {
  inr,
  maskAccount,
  shortDate,
  categoryLabel,
} from "@/lib/formats";

import {
  useAccounts,
  useBills,
  useDeposits,
  useProfile,
  useTransactions,
  type Txn,
} from "@/lib/banking";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      {
        title: "Dashboard | Nexa Smart Banking",
      },
      {
        name: "description",
        content:
          "Live account balances, cashflow charts, spending analysis and banking activity.",
      },
    ],
  }),

  component: Dashboard,
});

/* =========================================================
   CHART COLORS
========================================================= */

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

/* =========================================================
   TRANSACTION TYPE HELPER
========================================================= */

function getTransactionType(transaction: Txn) {
  const explicit = String(
    transaction.transaction_type ??
      transaction.direction ??
      "",
  ).toLowerCase();

  if (explicit === "credit" || explicit === "debit") {
    return explicit;
  }

  return Number(transaction.amount || 0) < 0
    ? "debit"
    : "credit";
}

function transactionAmount(transaction: Txn) {
  return Math.abs(Number(transaction.amount || 0));
}

/* =========================================================
   BUILD CASHFLOW
   Last 30 days
========================================================= */

function buildCashflow(txns: Txn[]) {
  const map = new Map<
    string,
    {
      label: string;
      credit: number;
      debit: number;
    }
  >();

  // Create 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date();

    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);

    const key = date.toISOString().split("T")[0];

    map.set(key, {
      label: shortDate(date),
      credit: 0,
      debit: 0,
    });
  }

  txns.forEach((transaction) => {
    const date = new Date(transaction.created_at);

    const key = date.toISOString().split("T")[0];

    const bucket = map.get(key);

    if (!bucket) {
      return;
    }

    const type = getTransactionType(transaction);
    const amount = transactionAmount(transaction);

    if (type === "credit") {
      bucket.credit += amount;
    }

    if (type === "debit") {
      bucket.debit += amount;
    }
  });

  return [...map.values()];
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard() {
  const { data: profile } = useProfile();

  const { data: accounts } = useAccounts();

  /*
   * 500 transactions so monthly calculations
   * have enough historical data.
   */
  const { data: txns } = useTransactions(500);

  const { data: bills } = useBills();

  const { data: deposits } = useDeposits();

  const [hidden, setHidden] = useState(false);

  const list = txns ?? [];

  /* =========================================================
     TOTAL ACCOUNT BALANCE
  ========================================================= */

  const totalBalance = useMemo(() => {
    return (accounts ?? []).reduce(
      (sum, account) =>
        sum + Number(account.balance || 0),
      0,
    );
  }, [accounts]);

  /* =========================================================
     CURRENT MONTH RANGE
  ========================================================= */

  const monthStart = useMemo(() => {
    const date = new Date();

    date.setHours(0, 0, 0, 0);
    date.setDate(1);

    return date;
  }, []);

  /* =========================================================
     MONEY IN — CURRENT MONTH
  ========================================================= */

  const inflow = useMemo(() => {
    return list
      .filter((transaction) => {
        const type = getTransactionType(transaction);

        return (
          type === "credit" &&
          new Date(transaction.created_at) >= monthStart
        );
      })
      .reduce(
        (sum, transaction) =>
          sum + transactionAmount(transaction),
        0,
      );
  }, [list, monthStart]);

  /* =========================================================
     MONEY OUT — CURRENT MONTH
  ========================================================= */

  const outflow = useMemo(() => {
    return list
      .filter((transaction) => {
        const type = getTransactionType(transaction);

        return (
          type === "debit" &&
          new Date(transaction.created_at) >= monthStart
        );
      })
      .reduce(
        (sum, transaction) =>
          sum + transactionAmount(transaction),
        0,
      );
  }, [list, monthStart]);

  /* =========================================================
     NET MOVEMENT
  ========================================================= */

  const netMovement = inflow - outflow;

  /* =========================================================
     TODAY'S DATE RANGE
  ========================================================= */

  const todayStart = useMemo(() => {
    const date = new Date();

    date.setHours(0, 0, 0, 0);

    return date;
  }, []);

  const tomorrowStart = useMemo(() => {
    const date = new Date();

    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 1);

    return date;
  }, []);

  /* =========================================================
     DAILY TRANSFER LIMIT USED
     
     Only transfer transactions count here.
  ========================================================= */

  const spentToday = useMemo(() => {
    return list
      .filter((transaction) => {
        const type = getTransactionType(transaction);

        const transactionDate = new Date(
          transaction.created_at,
        );

        const category = String(
          transaction.category ?? "",
        ).toLowerCase();

        const description = String(
          transaction.description ?? "",
        ).toLowerCase();

        const isTransfer =
          category === "transfer" ||
          description.includes("transfer");

        return (
          type === "debit" &&
          isTransfer &&
          transactionDate >= todayStart &&
          transactionDate < tomorrowStart
        );
      })
      .reduce(
        (sum, transaction) =>
          sum + transactionAmount(transaction),
        0,
      );
  }, [list, todayStart, tomorrowStart]);

  /* =========================================================
     DAILY LIMIT
  ========================================================= */

  const dailyLimit = Number(
    profile?.daily_limit ?? 200000,
  );

  const dailyLimitPercentage =
    dailyLimit > 0
      ? Math.min(
          100,
          (spentToday / dailyLimit) * 100,
        )
      : 0;

  /* =========================================================
     CASHFLOW CHART
  ========================================================= */

  const cashflow = useMemo(() => {
    return buildCashflow(list);
  }, [list]);

  /* =========================================================
     WHERE YOUR MONEY GOES
     
     Category-wise debit calculation.
  ========================================================= */

  const spendByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();

    list
      .filter(
        (transaction) =>
          getTransactionType(transaction) === "debit",
      )
      .forEach((transaction) => {
        const category =
          transaction.category || "other";

        const current =
          categoryMap.get(category) ?? 0;

        categoryMap.set(
          category,
          current +
            transactionAmount(transaction),
        );
      });

    return [...categoryMap.entries()]
      .map(([name, value]) => ({
        name: categoryLabel(name),
        value: Math.round(value),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [list]);

  /* =========================================================
     ACTIVE / UPCOMING BILLS
  ========================================================= */

  const dueBills = useMemo(() => {
    return (bills ?? []).filter(
      (bill) =>
        String(bill.status).toLowerCase() !==
        "paid",
    );
  }, [bills]);

  /* =========================================================
     INVESTED IN DEPOSITS
  ========================================================= */

  const activeDeposits = useMemo(() => {
    return (deposits ?? []).filter((deposit) => {
      const status = String(
        deposit.status ?? "",
      ).toLowerCase();

      return (
        status !== "closed" &&
        status !== "matured" &&
        status !== "cancelled"
      );
    });
  }, [deposits]);

  const investedValue = useMemo(() => {
    return activeDeposits.reduce(
      (sum, deposit) =>
        sum + Number(deposit.principal || 0),
      0,
    );
  }, [activeDeposits]);

  /* =========================================================
     QUICK ACTIONS
  ========================================================= */

  const quickActions = [
    {
      to: "/transfer",
      label: "Send Money",
      icon: ArrowLeftRight,
    },
    {
      to: "/bills",
      label: "Pay Bills",
      icon: Receipt,
    },
    {
      to: "/cards",
      label: "Manage Cards",
      icon: CreditCard,
    },
    {
      to: "/deposits",
      label: "Book FD",
      icon: PiggyBank,
    },
  ] as const;

  /* =========================================================
     RETURN UI
  ========================================================= */

  return (
    <AppShell
      title={`Good day, ${
        profile?.full_name?.split(" ")[0] ??
        "Customer"
      }`}
      subtitle={`Customer ID ${
        profile?.customer_id ?? "—"
      } · KYC ${
        profile?.kyc_status ?? "pending"
      }`}
    >
      <div className="space-y-6">

        {/* =====================================================
            TOP SECTION
        ===================================================== */}

        <div className="grid gap-4 lg:grid-cols-3">

          {/* ================= BALANCE ================= */}

          <Card className="bg-gradient-navy shadow-elevated relative overflow-hidden border-none lg:col-span-2">
            <div className="bg-gradient-mesh absolute inset-0 opacity-60" />

            <CardContent className="relative p-6">

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-navy-foreground/60 text-xs tracking-widest uppercase">
                    Total relationship balance
                  </p>

                  <p className="text-navy-foreground tabular font-display mt-2 text-4xl font-bold">
                    {hidden
                      ? "₹ ••••••"
                      : inr(totalBalance)}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-navy-foreground hover:bg-sidebar-accent"
                  onClick={() =>
                    setHidden((value) => !value)
                  }
                >
                  {hidden ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </Button>

              </div>

              {/* ACCOUNTS */}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">

                {(accounts ?? []).map(
                  (account) => (
                    <div
                      key={account.id}
                      className="bg-sidebar-accent/60 border-sidebar-border rounded-xl border p-3"
                    >

                      <div className="flex items-center justify-between">

                        <p className="text-navy-foreground text-sm font-semibold">
                          {account.nickname ??
                            account.account_name}
                        </p>

                        <Badge
                          variant="secondary"
                          className="text-[10px] uppercase"
                        >
                          {account.account_type}
                        </Badge>

                      </div>

                      <p className="text-navy-foreground/60 mt-1 font-mono text-xs">
                        {maskAccount(
                          account.account_number,
                        )}
                      </p>

                      <p className="text-navy-foreground tabular mt-2 text-lg font-bold">
                        {hidden
                          ? "••••"
                          : inr(
                              account.balance,
                            )}
                      </p>

                    </div>
                  ),
                )}

              </div>

            </CardContent>
          </Card>

          {/* ================= MONTHLY SUMMARY ================= */}

          <div className="grid gap-4">

            {/* MONEY IN */}

            <Card className="shadow-soft">
              <CardContent className="p-5">

                <div className="flex items-center gap-3">

                  <div className="bg-success/10 text-success flex size-10 items-center justify-center rounded-xl">
                    <ArrowDownLeft className="size-5" />
                  </div>

                  <div>

                    <p className="text-muted-foreground text-xs">
                      Money in (this month)
                    </p>

                    <p className="tabular text-xl font-bold">
                      {inr(inflow)}
                    </p>

                  </div>

                </div>

              </CardContent>
            </Card>

            {/* MONEY OUT */}

            <Card className="shadow-soft">
              <CardContent className="p-5">

                <div className="flex items-center gap-3">

                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                    <ArrowUpRight className="size-5" />
                  </div>

                  <div>

                    <p className="text-muted-foreground text-xs">
                      Money out (this month)
                    </p>

                    <p className="tabular text-xl font-bold">
                      {inr(outflow)}
                    </p>

                  </div>

                </div>

              </CardContent>
            </Card>

            {/* DAILY LIMIT */}

            <Card className="shadow-soft">
              <CardContent className="p-5">

                <div className="flex items-center justify-between">

                  <p className="text-muted-foreground text-xs">
                    Daily transfer limit used
                  </p>

                  <p className="text-xs font-semibold">
                    {Math.round(
                      dailyLimitPercentage,
                    )}
                    %
                  </p>

                </div>

                <Progress
                  value={dailyLimitPercentage}
                  className="mt-3 h-2"
                />

                <div className="mt-2 flex items-center justify-between">

                  <p className="tabular text-xs font-medium">
                    {inr(spentToday)}
                  </p>

                  <p className="text-muted-foreground tabular text-xs">
                    of {inr(dailyLimit)}
                  </p>

                </div>

              </CardContent>
            </Card>

          </div>
        </div>

        {/* =====================================================
            QUICK ACTIONS
        ===================================================== */}

        <div className="grid gap-3 sm:grid-cols-4">

          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
            >
              <Card className="hover:border-primary/40 hover:shadow-glow group cursor-pointer transition-all">

                <CardContent className="flex items-center gap-3 p-4">

                  <div className="bg-secondary text-primary group-hover:bg-gradient-brand group-hover:text-primary-foreground flex size-10 items-center justify-center rounded-xl transition-all">

                    <action.icon className="size-5" />

                  </div>

                  <span className="text-sm font-semibold">
                    {action.label}
                  </span>

                </CardContent>

              </Card>
            </Link>
          ))}

        </div>

        {/* =====================================================
            CASHFLOW + SPENDING
        ===================================================== */}

        <div className="grid gap-4 lg:grid-cols-5">

          {/* CASHFLOW */}

          <Card className="shadow-soft lg:col-span-3">

            <CardHeader className="pb-2">

              <div className="flex items-center justify-between">

                <CardTitle className="text-base">
                  Cashflow trend
                </CardTitle>

                <div className="text-muted-foreground text-xs">
                  Last 30 days
                </div>

              </div>

            </CardHeader>

            <CardContent className="h-[280px] pt-2">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <AreaChart data={cashflow}>

                  <defs>

                    <linearGradient
                      id="cIn"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >

                      <stop
                        offset="0%"
                        stopColor="var(--color-chart-2)"
                        stopOpacity={0.45}
                      />

                      <stop
                        offset="100%"
                        stopColor="var(--color-chart-2)"
                        stopOpacity={0}
                      />

                    </linearGradient>

                    <linearGradient
                      id="cOut"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >

                      <stop
                        offset="0%"
                        stopColor="var(--color-chart-1)"
                        stopOpacity={0.45}
                      />

                      <stop
                        offset="100%"
                        stopColor="var(--color-chart-1)"
                        stopOpacity={0}
                      />

                    </linearGradient>

                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    stroke="var(--color-muted-foreground)"
                  />

                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="var(--color-muted-foreground)"
                    tickFormatter={(value) =>
                      inr(value, true)
                    }
                  />

                  <Tooltip
                    formatter={(value: number) =>
                      inr(value)
                    }
                    contentStyle={{
                      background:
                        "var(--color-card)",
                      border:
                        "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="credit"
                    name="Money In"
                    stroke="var(--color-chart-2)"
                    fill="url(#cIn)"
                    strokeWidth={2}
                  />

                  <Area
                    type="monotone"
                    dataKey="debit"
                    name="Money Out"
                    stroke="var(--color-chart-1)"
                    fill="url(#cOut)"
                    strokeWidth={2}
                  />

                </AreaChart>

              </ResponsiveContainer>

            </CardContent>

          </Card>

          {/* WHERE MONEY GOES */}

          <Card className="shadow-soft lg:col-span-2">

            <CardHeader className="pb-2">

              <CardTitle className="text-base">
                Where your money goes
              </CardTitle>

            </CardHeader>

            <CardContent className="h-[280px]">

              {spendByCategory.length === 0 ? (

                <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                  No spending data available
                </div>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <PieChart>

                    <Pie
                      data={spendByCategory}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={92}
                      paddingAngle={3}
                    >

                      {spendByCategory.map(
                        (_, index) => (
                          <Cell
                            key={`category-${index}`}
                            fill={
                              CHART_COLORS[
                                index %
                                  CHART_COLORS.length
                              ]
                            }
                          />
                        ),
                      )}

                    </Pie>

                    <Tooltip
                      formatter={(
                        value: number,
                      ) => inr(value)}
                      contentStyle={{
                        background:
                          "var(--color-card)",
                        border:
                          "1px solid var(--color-border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />

                  </PieChart>

                </ResponsiveContainer>

              )}

            </CardContent>

          </Card>

        </div>

        {/* =====================================================
            RECENT ACTIVITY + RIGHT SIDEBAR
        ===================================================== */}

        <div className="grid gap-4 lg:grid-cols-3">

          {/* RECENT ACTIVITY */}

          <Card className="shadow-soft lg:col-span-2">

            <CardHeader className="flex-row items-center justify-between pb-2">

              <CardTitle className="text-base">
                Recent activity
              </CardTitle>

              <Link
                to="/transactions"
                className="text-primary text-xs font-semibold"
              >
                View all
              </Link>

            </CardHeader>

            <CardContent className="space-y-1 pt-2">

              {list.length === 0 ? (

                <div className="text-muted-foreground py-10 text-center text-sm">
                  No transactions found
                </div>

              ) : (

                list.slice(0, 7).map(
                  (transaction) => {

                    const type =
                      getTransactionType(
                        transaction,
                      );

                    const isCredit =
                      type === "credit";

                    return (
                      <div
                        key={transaction.id}
                        className="hover:bg-secondary/60 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors"
                      >

                        {/* ICON */}

                        <div
                          className={`flex size-9 items-center justify-center rounded-full ${
                            isCredit
                              ? "bg-success/10 text-success"
                              : "bg-primary/10 text-primary"
                          }`}
                        >

                          {isCredit ? (
                            <ArrowDownLeft className="size-4" />
                          ) : (
                            <ArrowUpRight className="size-4" />
                          )}

                        </div>

                        {/* DESCRIPTION */}

                        <div className="min-w-0 flex-1">

                          <p className="truncate text-sm font-medium">
                            {
                              transaction.description
                            }
                          </p>

                          <p className="text-muted-foreground text-xs">
                            {transaction.mode} ·{" "}
                            {shortDate(
                              transaction.created_at,
                            )}
                          </p>

                        </div>

                        {/* AMOUNT */}

                        <p
                          className={`tabular text-sm font-semibold ${
                            isCredit
                              ? "text-success"
                              : "text-foreground"
                          }`}
                        >
                          {isCredit
                            ? "+"
                            : "−"}

                          {inr(
                            transactionAmount(transaction),
                          )}
                        </p>

                      </div>
                    );
                  },
                )

              )}

            </CardContent>

          </Card>

          {/* RIGHT SIDE */}

          <div className="space-y-4">

            {/* UPCOMING BILLS */}

            <Card className="shadow-soft">

              <CardHeader className="pb-2">

                <CardTitle className="text-base">
                  Upcoming bills
                </CardTitle>

              </CardHeader>

              <CardContent className="space-y-3 pt-2">

                {dueBills
                  .slice(0, 3)
                  .map((bill) => (

                    <div
                      key={bill.id}
                      className="flex items-center justify-between"
                    >

                      <div>

                        <p className="text-sm font-medium">
                          {bill.biller_name}
                        </p>

                        <p className="text-muted-foreground text-xs">
                          Due{" "}
                          {shortDate(
                            bill.due_date,
                          )}
                        </p>

                      </div>

                      <p className="tabular text-sm font-semibold">
                        {inr(bill.amount)}
                      </p>

                    </div>

                  ))}

                {dueBills.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    All bills settled 🎉
                  </p>
                )}

                <Link to="/bills">

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Go to bill desk
                  </Button>

                </Link>

              </CardContent>

            </Card>

            {/* INVESTMENTS */}

            <Card className="shadow-soft">

              <CardContent className="p-5">

                <div className="flex items-center gap-3">

                  <div className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-xl">
                    <TrendingUp className="size-5" />
                  </div>

                  <div>

                    <p className="text-muted-foreground text-xs">
                      Invested in deposits
                    </p>

                    <p className="tabular text-xl font-bold">
                      {inr(
                        investedValue,
                      )}
                    </p>

                  </div>

                </div>

                <div className="text-muted-foreground mt-4 flex items-center gap-2 text-xs">

                  <Wallet className="size-3.5" />

                  {activeDeposits.length}{" "}
                  active deposit
                  {activeDeposits.length !==
                  1
                    ? "s"
                    : ""}

                </div>

              </CardContent>

            </Card>

            {/* NET MOVEMENT */}

            <Card className="shadow-soft">

              <CardContent className="p-5">

                <p className="text-muted-foreground text-xs">
                  Net movement this month
                </p>

                <p
                  className={`tabular mt-1 text-2xl font-bold ${
                    netMovement >= 0
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {netMovement >= 0
                    ? "+"
                    : "−"}

                  {inr(
                    Math.abs(netMovement),
                  )}
                </p>

                <p className="text-muted-foreground mt-1 text-xs">
                  Money in − Money out
                </p>

              </CardContent>

            </Card>

          </div>

        </div>

      </div>
    </AppShell>
  );
}
