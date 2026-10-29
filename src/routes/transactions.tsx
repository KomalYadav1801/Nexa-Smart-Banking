import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Search,
} from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useTransactions } from "@/lib/banking";
import { inr, longDateTime, categoryLabel } from "@/lib/formats";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      {
        title: "Transactions & Statements | Nexa Smart Banking",
      },
      {
        name: "description",
        content:
          "Search, filter and export your full Nexa banking statement with categories, modes and reference numbers.",
      },
      {
        property: "og:title",
        content: "Transactions & Statements | Nexa Smart Banking",
      },
      {
        property: "og:description",
        content: "Every debit and credit, searchable and exportable.",
      },
    ],
  }),

  component: TransactionsPage,
});

function TransactionsPage() {
  const { data: txns } = useTransactions(500);

  const [q, setQ] = useState("");
  const [dir, setDir] = useState("all");
  const [cat, setCat] = useState("all");
  const [range, setRange] = useState("90");

  /*
   * Categories
   */
  const categories = useMemo(
    () =>
      [...new Set((txns ?? []).map((t) => t.category).filter(Boolean))],
    [txns],
  );

  /*
   * Filter transactions
   */
  const filtered = useMemo(() => {
    const since = new Date();

    since.setDate(since.getDate() - Number(range));

    return (txns ?? []).filter((t) => {
      /*
       * Date filter
       */
      if (new Date(t.created_at) < since) {
        return false;
      }

      /*
       * Credit / Debit filter
       */
      if (dir !== "all" && t.direction !== dir) {
        return false;
      }

      /*
       * Category filter
       */
      if (cat !== "all" && t.category !== cat) {
        return false;
      }

      /*
       * Search filter
       */
      if (q.trim()) {
        const searchText = `
          ${t.description ?? ""}
          ${t.counterparty ?? ""}
          ${t.reference ?? ""}
          ${t.mode ?? ""}
          ${t.category ?? ""}
        `.toLowerCase();

        if (!searchText.includes(q.trim().toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [txns, q, dir, cat, range]);

  /*
   * IMPORTANT:
   *
   * Database now stores:
   *
   * credit = positive amount
   * debit  = negative amount
   *
   * Example:
   * Salary        +45000
   * Money Received +4000
   * Transfer      -500
   * Water Bill    -480
   *
   * Therefore totals must use Math.abs().
   */

  const totalIn = filtered
    .filter((t) => t.direction === "credit")
    .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);

  const totalOut = filtered
    .filter((t) => t.direction === "debit")
    .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);

  const netMovement = totalIn - totalOut;

  /*
   * CSV Export
   */
  const exportCsv = () => {
    const rows = [
      [
        "Date",
        "Description",
        "Counterparty",
        "Mode",
        "Category",
        "Type",
        "Amount",
        "Balance",
        "Reference",
      ],

      ...filtered.map((t) => [
        longDateTime(t.created_at),
        t.description ?? "",
        t.counterparty ?? "",
        t.mode ?? "",
        t.category ?? "",
        t.direction ?? "",
        String(t.amount ?? 0),
        String(t.balance_after ?? ""),
        t.reference ?? "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "");

            /*
             * Escape double quotes correctly for CSV.
             */
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = `nexa-statement-${Date.now()}.csv`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      title="Transactions"
      subtitle="Full statement with smart filters and CSV export"
    >
      <div className="space-y-5">

        {/* =========================
            SUMMARY CARDS
        ========================== */}

        <div className="grid gap-4 sm:grid-cols-3">

          {/* Credits */}
          <Card className="shadow-soft">
            <CardContent className="p-5">
              <p className="text-muted-foreground text-xs">
                Credits in range
              </p>

              <p className="text-success tabular text-xl font-bold">
                {inr(totalIn)}
              </p>
            </CardContent>
          </Card>

          {/* Debits */}
          <Card className="shadow-soft">
            <CardContent className="p-5">
              <p className="text-muted-foreground text-xs">
                Debits in range
              </p>

              <p className="tabular text-xl font-bold">
                {inr(totalOut)}
              </p>
            </CardContent>
          </Card>

          {/* Net movement */}
          <Card className="shadow-soft">
            <CardContent className="p-5">
              <p className="text-muted-foreground text-xs">
                Net movement
              </p>

              <p
                className={`tabular text-xl font-bold ${
                  netMovement >= 0
                    ? "text-success"
                    : "text-destructive"
                }`}
              >
                {netMovement >= 0 ? "+" : "−"}
                {inr(Math.abs(netMovement))}
              </p>
            </CardContent>
          </Card>

        </div>

        {/* =========================
            TRANSACTIONS TABLE
        ========================== */}

        <Card className="shadow-soft">
          <CardContent className="space-y-4 p-5">

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">

              {/* Search */}
              <div className="relative min-w-[220px] flex-1">

                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />

                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search merchant, reference, mode…"
                  className="pl-9"
                />

              </div>

              {/* Direction */}
              <Select
                value={dir}
                onValueChange={setDir}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All types
                  </SelectItem>

                  <SelectItem value="credit">
                    Credits
                  </SelectItem>

                  <SelectItem value="debit">
                    Debits
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Category */}
              <Select
                value={cat}
                onValueChange={setCat}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All categories
                  </SelectItem>

                  {categories.map((c) => (
                    <SelectItem
                      key={c}
                      value={c}
                    >
                      {categoryLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date range */}
              <Select
                value={range}
                onValueChange={setRange}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="7">
                    Last 7 days
                  </SelectItem>

                  <SelectItem value="30">
                    Last 30 days
                  </SelectItem>

                  <SelectItem value="90">
                    Last 90 days
                  </SelectItem>

                  <SelectItem value="365">
                    Last year
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Export */}
              <Button
                variant="outline"
                onClick={exportCsv}
                className="gap-2"
              >
                <Download className="size-4" />
                Export
              </Button>

            </div>

            {/* Table */}
            <div className="overflow-x-auto">

              <Table>

                <TableHeader>
                  <TableRow>

                    <TableHead>
                      Description
                    </TableHead>

                    <TableHead>
                      Mode
                    </TableHead>

                    <TableHead>
                      Category
                    </TableHead>

                    <TableHead>
                      Date
                    </TableHead>

                    <TableHead className="text-right">
                      Amount
                    </TableHead>

                  </TableRow>
                </TableHeader>

                <TableBody>

                  {filtered.map((t) => {

                    const isCredit =
                      t.direction === "credit";

                    /*
                     * Database stores debit as negative.
                     * UI should show:
                     *
                     * +₹4,000.00
                     * -₹500.00
                     *
                     * Never:
                     * --₹500.00
                     */

                    const displayAmount = Math.abs(
                      Number(t.amount) || 0,
                    );

                    return (
                      <TableRow key={t.id}>

                        {/* Description */}
                        <TableCell>

                          <div className="flex items-center gap-3">

                            <div
                              className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
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

                            <div>

                              <p className="text-sm font-medium">
                                {t.description}
                              </p>

                              <p className="text-muted-foreground font-mono text-[11px]">
                                {t.reference}
                              </p>

                            </div>

                          </div>

                        </TableCell>

                        {/* Mode */}
                        <TableCell>
                          <Badge variant="secondary">
                            {t.mode}
                          </Badge>
                        </TableCell>

                        {/* Category */}
                        <TableCell className="text-muted-foreground text-sm">
                          {categoryLabel(t.category)}
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-muted-foreground text-xs">
                          {longDateTime(t.created_at)}
                        </TableCell>

                        {/* Amount */}
                        <TableCell
                          className={`tabular text-right font-semibold ${
                            isCredit
                              ? "text-success"
                              : ""
                          }`}
                        >
                          {isCredit ? "+" : "−"}
                          {inr(displayAmount)}
                        </TableCell>

                      </TableRow>
                    );
                  })}

                  {/* Empty state */}
                  {filtered.length === 0 && (
                    <TableRow>

                      <TableCell
                        colSpan={5}
                        className="text-muted-foreground py-10 text-center"
                      >
                        No transactions match these filters.
                      </TableCell>

                    </TableRow>
                  )}

                </TableBody>

              </Table>

            </div>

          </CardContent>
        </Card>

      </div>
    </AppShell>
  );
}