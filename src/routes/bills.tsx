import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Zap,
  Smartphone,
  Flame,
  Wifi,
  Tv,
  Droplets,
  Loader2,
  Plus,
  ShieldCheck,
  PlayCircle,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useAccounts,
  useAddBill,
  useBills,
  usePayBill,
  useRefreshBanking,
  useToggleBillAutopay,
} from "@/lib/banking";
import { inr, shortDate, maskAccount } from "@/lib/formats";

export const Route = createFileRoute("/bills")({
  head: () => ({
    meta: [
      { title: "Bills & Recharge | Nexa Smart Banking" },
      {
        name: "description",
        content:
          "Pay electricity, mobile, gas, broadband and DTH bills instantly, and set autopay mandates on Nexa.",
      },
      { property: "og:title", content: "Bills & Recharge | Nexa Smart Banking" },
      {
        property: "og:description",
        content: "One bill desk for every utility you pay.",
      },
    ],
  }),
  component: BillsPage,
});

const CATEGORY_ICON: Record<string, typeof Zap> = {
  electricity: Zap,
  mobile: Smartphone,
  gas: Flame,
  broadband: Wifi,
  internet: Wifi,
  dth: Tv,
  water: Droplets,
  insurance: ShieldCheck,
  subscription: PlayCircle,
};

const CATEGORY_OPTIONS = [
  "electricity",
  "mobile",
  "gas",
  "broadband",
  "dth",
  "water",
  "insurance",
  "subscription",
];

function BillsPage() {
  const { data: bills, isLoading: billsLoading } = useBills();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const payBill = usePayBill();
  const addBill = useAddBill();
  const toggleAutopay = useToggleBillAutopay();
  const refresh = useRefreshBanking();

  const [from, setFrom] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    biller_name: "",
    category: "electricity",
    consumer_number: "",
    amount: "",
  });

  const source =
    (accounts ?? []).find((account) => account.id === from) ?? accounts?.[0];

  const due = (bills ?? []).filter((bill) => bill.status !== "paid");
  const paid = (bills ?? []).filter((bill) => bill.status === "paid");

  const pay = async (billId: string) => {
    if (!source) {
      toast.error("Please select an account first");
      return;
    }

    try {
      const res = await payBill.mutateAsync({
        billId,
        from: source.id,
      });

      toast.success(`Bill paid · ${res.reference}`);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to pay bill");
    }
  };

  const addBiller = async () => {
    const billerName = form.biller_name.trim();
    const consumerNumber = form.consumer_number.trim();
    const amount = Number(form.amount);

    if (!billerName || !consumerNumber) {
      toast.error("Fill biller name and consumer number");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid bill amount");
      return;
    }

    try {
      // useAddBill always supplies due_date, so the bills.due_date NOT NULL
      // constraint is satisfied.
      await addBill.mutateAsync({
        billerName,
        category: form.category,
        consumerNumber,
        amount,
        autopay: false,
      });

      toast.success("Biller added");
      setOpen(false);
      setForm({
        biller_name: "",
        category: "electricity",
        consumer_number: "",
        amount: "",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add biller");
    }
  };

  const handleAutopay = async (id: string, value: boolean) => {
    try {
      await toggleAutopay.mutateAsync({
        billId: id,
        autopay: value,
      });

      toast.success(value ? "Autopay enabled" : "Autopay disabled");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update autopay",
      );
    }
  };

  const isLoading = billsLoading || accountsLoading;

  return (
    <AppShell
      title="Bills & Recharge"
      subtitle="BBPS-style bill desk with autopay mandates"
    >
      <div className="space-y-6">
        {/* TOP CONTROLS */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={source?.id ?? ""} onValueChange={setFrom}>
            <SelectTrigger className="w-[320px]">
              <SelectValue placeholder="Pay from" />
            </SelectTrigger>
            <SelectContent>
              {(accounts ?? []).map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {(account.nickname ?? account.account_name ?? "Nexa Account")} · {maskAccount(account.account_number)} · {inr(account.balance)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                Add biller
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a new biller</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Biller name</Label>
                  <Input
                    value={form.biller_name}
                    onChange={(event) =>
                      setForm({ ...form, biller_name: event.target.value })
                    }
                    placeholder="Adani Electricity"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) =>
                      setForm({ ...form, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Consumer number</Label>
                  <Input
                    value={form.consumer_number}
                    onChange={(event) =>
                      setForm({ ...form, consumer_number: event.target.value })
                    }
                    placeholder="Consumer / account number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bill amount</Label>
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) =>
                      setForm({ ...form, amount: event.target.value })
                    }
                    placeholder="1500"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={addBiller}
                  disabled={addBill.isPending}
                >
                  {addBill.isPending && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Save biller
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* BILLS */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading && (
            <Card className="shadow-soft md:col-span-2 xl:col-span-3">
              <CardContent className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                Loading bills...
              </CardContent>
            </Card>
          )}

          {!isLoading &&
            due.map((bill) => {
              const Icon = CATEGORY_ICON[bill.category] ?? Zap;
              const dueDate = new Date(`${bill.due_date}T23:59:59`);
              const overdue = dueDate < new Date();
              const paying = payBill.isPending;
              const changingAutopay = toggleAutopay.isPending;

              return (
                <Card key={bill.id} className="shadow-soft">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="bg-secondary text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                          <Icon className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{bill.biller_name}</p>
                          <p className="text-muted-foreground font-mono text-xs">
                            {bill.consumer_number}
                          </p>
                        </div>
                      </div>

                      <Badge variant={overdue ? "destructive" : "secondary"}>
                        {overdue ? "Overdue" : `Due ${shortDate(bill.due_date)}`}
                      </Badge>
                    </div>

                    <p className="tabular font-display text-2xl font-bold">
                      {inr(bill.amount)}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={Boolean(bill.autopay)}
                          onCheckedChange={(value) =>
                            handleAutopay(bill.id, value)
                          }
                          disabled={changingAutopay}
                          id={`ap-${bill.id}`}
                        />
                        <Label htmlFor={`ap-${bill.id}`} className="text-xs">
                          Autopay
                        </Label>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => pay(bill.id)}
                        disabled={paying || !source}
                      >
                        {paying && (
                          <Loader2 className="mr-2 size-3.5 animate-spin" />
                        )}
                        Pay now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

          {!isLoading && due.length === 0 && (
            <Card className="shadow-soft md:col-span-2 xl:col-span-3">
              <CardContent className="text-muted-foreground p-10 text-center">
                Nothing due right now. Add a biller to get started.
              </CardContent>
            </Card>
          )}
        </div>

        {/* PAID RECENTLY */}
        {paid.length > 0 && (
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Paid recently</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {paid.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{bill.biller_name}</span>
                  <span className="text-muted-foreground tabular">
                    {inr(bill.amount)} · paid
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
