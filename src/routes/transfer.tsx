import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Zap, CheckCircle2, AlertTriangle, LockKeyhole } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAccounts, useBeneficiaries, useTransfer } from "@/lib/banking";
import { inr, maskAccount } from "@/lib/formats";

export const Route = createFileRoute("/transfer")({
  head: () => ({
    meta: [
      { title: "Transfer Money | Nexa Smart Banking" },
      {
        name: "description",
        content:
          "Send money instantly via UPI, IMPS, NEFT or RTGS to saved beneficiaries or between your own Nexa accounts.",
      },
      { property: "og:title", content: "Transfer Money | Nexa Smart Banking" },
      { property: "og:description", content: "Instant, limit-checked fund transfers." },
    ],
  }),
  component: TransferPage,
});

const MODES = ["UPI", "IMPS", "NEFT", "RTGS"] as const;

const MODE_RULES: Record<(typeof MODES)[number], {
  min: number;
  max: number | null;
  helper: string;
}> = {
  UPI: { min: 1, max: 100000, helper: "Up to ₹1,00,000 per transaction" },
  IMPS: { min: 1, max: 500000, helper: "Instant transfer, up to ₹5,00,000" },
  NEFT: { min: 1, max: null, helper: "Subject to balance and your daily transfer limit" },
  RTGS: { min: 200000, max: null, helper: "Minimum transfer amount ₹2,00,000" },
};

function TransferPage() {
  const { data: accounts } = useAccounts();
  const { data: beneficiaries } = useBeneficiaries();
  const transfer = useTransfer();

  const [from, setFrom] = useState("");
  const [target, setTarget] = useState("");
  const [tab, setTab] = useState("beneficiary");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<(typeof MODES)[number]>("IMPS");
  const [remarks, setRemarks] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [receipt, setReceipt] = useState<{
    reference: string;
    party: string;
    amount: number;
    mode: string;
    riskScore: number;
    riskLevel: "low" | "medium" | "high";
    riskReasons: string[];
  } | null>(null);

  const source = (accounts ?? []).find((a) => a.id === from) ?? accounts?.[0];
  const amountNum = Number(amount || 0);
  const rules = MODE_RULES[mode];

  const basicAmountValid =
    Number.isFinite(amountNum) &&
    amountNum > 0 &&
    amountNum >= rules.min &&
    (rules.max === null || amountNum <= rules.max) &&
    !!source &&
    amountNum <= Number(source.balance);

  const validateTransfer = () => {
    if (!source) {
      toast.error("Select a source account");
      return false;
    }
    if (!target) {
      toast.error("Choose where the money should go");
      return false;
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error("Enter a valid amount");
      return false;
    }
    if (amountNum < rules.min) {
      toast.error(`${mode} minimum transfer amount is ${inr(rules.min)}`);
      return false;
    }
    if (rules.max !== null && amountNum > rules.max) {
      toast.error(`${mode} maximum transfer amount is ${inr(rules.max)}`);
      return false;
    }
    if (amountNum > Number(source.balance)) {
      toast.error("Amount exceeds available balance");
      return false;
    }
    if (tab === "self" && target === source.id) {
      toast.error("Source and destination accounts must be different");
      return false;
    }
    return true;
  };

  const start = () => {
    if (!validateTransfer()) return;
    setOtp("");
    setOtpOpen(true);
  };

  const confirm = async () => {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    if (!validateTransfer() || !source) return;

    try {
      const res = await transfer.mutateAsync({
        from: source.id,
        amount: amountNum,
        mode,
        ...(tab === "beneficiary" ? { beneficiaryId: target } : { toAccount: target }),
        remarks: remarks.trim(),
      });

      setOtpOpen(false);
      const result = res as {
        reference?: string;
        party?: string;
        amount?: number | string;
        mode?: string;
        risk_score?: number | string;
        risk_level?: "low" | "medium" | "high";
        risk_reasons?: unknown;
      };

      const parsedReasons = Array.isArray(result.risk_reasons)
        ? result.risk_reasons.map((reason) => String(reason))
        : [];

      const riskLevel =
        result.risk_level === "high" ||
        result.risk_level === "medium" ||
        result.risk_level === "low"
          ? result.risk_level
          : "low";

      setReceipt({
        reference: String(result.reference ?? ""),
        party: String(result.party ?? ""),
        amount: Number(result.amount ?? amountNum),
        mode: String(result.mode ?? mode),
        riskScore: Math.max(0, Math.min(100, Number(result.risk_score ?? 0))),
        riskLevel,
        riskReasons: parsedReasons,
      });
      setAmount("");
      setRemarks("");
      setTarget("");
      toast.success("Transfer successful");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const quickAmounts = [500, 1000, 5000, 10000, 50000, 100000];

  return (
    <AppShell title="Transfer Money" subtitle="UPI · IMPS · NEFT · RTGS — settled securely">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">New transfer</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>From account</Label>
              <Select value={source?.id ?? ""} onValueChange={setFrom}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {(accounts ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nickname} · {maskAccount(a.account_number)} · {inr(a.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs
              value={tab}
              onValueChange={(v) => {
                setTab(v);
                setTarget("");
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="beneficiary">To beneficiary</TabsTrigger>
                <TabsTrigger value="self">Between my accounts</TabsTrigger>
              </TabsList>

              <TabsContent value="beneficiary" className="pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {(beneficiaries ?? []).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setTarget(b.id)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        target === b.id
                          ? "border-primary bg-primary/5 shadow-glow"
                          : "hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{b.nickname}</p>
                        {b.is_verified && (
                          <Badge variant="secondary" className="text-[10px]">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs">{b.full_name}</p>
                      <p className="text-muted-foreground mt-1 font-mono text-[11px]">
                        {maskAccount(b.account_number)} · {b.bank_name}
                      </p>
                    </button>
                  ))}
                  {(beneficiaries ?? []).length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      Add a beneficiary first from the Beneficiaries page.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="self" className="pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {(accounts ?? [])
                    .filter((a) => a.id !== source?.id)
                    .map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setTarget(a.id)}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          target === a.id
                            ? "border-primary bg-primary/5 shadow-glow"
                            : "hover:border-primary/40"
                        }`}
                      >
                        <p className="text-sm font-semibold">{a.nickname}</p>
                        <p className="text-muted-foreground font-mono text-[11px]">
                          {maskAccount(a.account_number)}
                        </p>
                        <p className="tabular mt-1 text-sm font-semibold">{inr(a.balance)}</p>
                      </button>
                    ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amt">Amount (INR)</Label>
                <Input
                  id="amt"
                  type="number"
                  min={rules.min}
                  max={rules.max ?? undefined}
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={mode === "RTGS" ? "200000" : "5000"}
                  className="tabular text-lg font-semibold"
                />

                <div className="flex flex-wrap gap-2 pt-1">
                  {quickAmounts.map((q) => (
                    <Button
                      key={q}
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={
                        mode === "RTGS" ||
                        (rules.max !== null && q > rules.max)
                      }
                      onClick={() => setAmount(String(q))}
                    >
                      +₹{q.toLocaleString("en-IN")}
                    </Button>
                  ))}
                  {mode === "RTGS" && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setAmount("200000")}
                    >
                      ₹2,00,000
                    </Button>
                  )}
                </div>

                <p className="text-muted-foreground text-xs">
                  Minimum: {inr(rules.min)}
                  {rules.max !== null ? ` · Maximum: ${inr(rules.max)}` : ""}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Transfer mode</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as (typeof MODES)[number])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-muted-foreground text-xs">{rules.helper}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Rent for August"
                rows={2}
                maxLength={100}
              />
              <p className="text-muted-foreground text-[11px]">
                This remark will appear as the transaction description.
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={start}
              disabled={transfer.isPending || !source || !target || !basicAmountValid}
            >
              {transfer.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Continue securely
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-gradient-navy border-none">
            <CardContent className="p-5">
              <div className="text-navy-foreground flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="text-success size-4" />
                Safety checks applied
              </div>
              <ul className="text-navy-foreground/70 mt-3 space-y-2 text-xs">
                <li>• Server verifies account ownership before debit</li>
                <li>• Daily limit enforced on every transaction</li>
                <li>• Atomic debit + credit with audit reference</li>
                <li>• OTP step-up authentication</li>
                <li>• Mode-specific amount limits</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Zap className="text-warning size-4" />
                Mode guide
              </div>
              <div className="text-muted-foreground mt-3 space-y-2 text-xs">
                <p><b className="text-foreground">UPI</b> — up to ₹1,00,000 per transaction</p>
                <p><b className="text-foreground">IMPS</b> — instant, up to ₹5,00,000</p>
                <p><b className="text-foreground">NEFT</b> — batch settled, subject to balance/daily limit</p>
                <p><b className="text-foreground">RTGS</b> — minimum ₹2,00,000</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={otpOpen} onOpenChange={setOtpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm with OTP</DialogTitle>
            <DialogDescription>
              Sending {inr(amountNum)} via {mode}. Enter any 6 digits — this is a demo OTP step.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-4">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <DialogFooter>
            <Button
              onClick={confirm}
              disabled={transfer.isPending || !basicAmountValid}
              className="w-full"
            >
              {transfer.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Authorise transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!receipt} onOpenChange={() => setReceipt(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="text-success size-5" />
              Transfer successful
            </DialogTitle>
            <DialogDescription>
              Your transaction was completed and Smart Guard recorded the transfer risk assessment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2 rounded-xl border p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="tabular font-semibold">{inr(receipt?.amount ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Beneficiary</span>
                <span className="font-semibold">{receipt?.party}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-semibold">{receipt?.mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs">{receipt?.reference}</span>
              </div>
            </div>

            <div
              className={`rounded-xl border p-4 ${
                receipt?.riskLevel === "high"
                  ? "border-destructive/30 bg-destructive/5"
                  : receipt?.riskLevel === "medium"
                    ? "border-warning/30 bg-warning/5"
                    : "border-success/30 bg-success/5"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    {receipt?.riskLevel === "high" ? (
                      <AlertTriangle className="text-destructive size-4" />
                    ) : (
                      <LockKeyhole className="text-success size-4" />
                    )}
                    Nexa Smart Guard
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {receipt?.riskLevel === "high"
                      ? "High-risk transfer recorded for review."
                      : receipt?.riskLevel === "medium"
                        ? "Some unusual signals were detected."
                        : "No significant risk signals were detected."}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-muted-foreground text-[11px]">Risk score</p>
                  <p className="tabular text-xl font-bold">
                    {receipt?.riskScore ?? 0}/100
                  </p>
                </div>
              </div>

              {receipt?.riskReasons && receipt.riskReasons.length > 0 ? (
                <div className="mt-3 space-y-1.5">
                  {receipt.riskReasons.map((reason) => (
                    <div key={reason} className="flex items-start gap-2 text-xs">
                      <span className="bg-foreground/30 mt-1.5 size-1.5 shrink-0 rounded-full" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <CheckCircle2 className="text-success size-4" />
                  <span>Transfer matches your current safety profile.</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="w-full" onClick={() => setReceipt(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
