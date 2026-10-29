import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, BadgeCheck, Search } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { supabase } from "@/integrations/supabase/client";
import { useBeneficiaries, useRefreshBanking } from "@/lib/banking";
import { maskAccount } from "@/lib/formats";

export const Route = createFileRoute("/beneficiaries")({
  head: () => ({
    meta: [
      { title: "Beneficiaries | Nexa Smart Banking" },
      {
        name: "description",
        content:
          "Add, verify and manage payees for instant IMPS, NEFT and UPI transfers from your Nexa accounts.",
      },
      { property: "og:title", content: "Beneficiaries | Nexa Smart Banking" },
      { property: "og:description", content: "Your trusted payee list, verified and searchable." },
    ],
  }),
  component: BeneficiariesPage,
});

const EMPTY = {
  nickname: "",
  full_name: "",
  account_number: "",
  ifsc: "",
  bank_name: "",
  transfer_type: "IMPS",
};

function BeneficiariesPage() {
  const { data: beneficiaries } = useBeneficiaries();
  const refresh = useRefreshBanking();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(EMPTY);

  const save = async () => {
    if (!form.nickname || !form.full_name || !form.account_number || !form.ifsc) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc.toUpperCase())) {
      toast.error("IFSC looks invalid (e.g. HDFC0001234)");
      return;
    }
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from("beneficiaries").insert({
      ...form,
      ifsc: form.ifsc.toUpperCase(),
      bank_name: form.bank_name || "Nexa Bank",
      user_id: user!.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Beneficiary added and verified");
    setForm(EMPTY);
    setOpen(false);
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("beneficiaries").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Beneficiary removed");
      refresh();
    }
  };

  const list = (beneficiaries ?? []).filter((b) =>
    `${b.nickname} ${b.full_name} ${b.bank_name} ${b.account_number}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );

  return (
    <AppShell title="Beneficiaries" subtitle="Manage the people and businesses you pay">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search payees"
              className="pl-9"
            />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" /> Add beneficiary
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add beneficiary</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nickname *</Label>
                  <Input
                    value={form.nickname}
                    onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                    placeholder="Rahul"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Full name *</Label>
                  <Input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Rahul Sharma"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account number *</Label>
                  <Input
                    value={form.account_number}
                    onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>IFSC *</Label>
                  <Input
                    value={form.ifsc}
                    onChange={(e) => setForm({ ...form, ifsc: e.target.value })}
                    placeholder="HDFC0001234"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bank name</Label>
                  <Input
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    placeholder="HDFC Bank"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preferred mode</Label>
                  <Select
                    value={form.transfer_type}
                    onValueChange={(v) => setForm({ ...form, transfer_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["UPI", "IMPS", "NEFT", "RTGS"].map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={save}>
                Add & verify
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((b) => (
            <Card key={b.id} className="shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-brand text-primary-foreground flex size-11 items-center justify-center rounded-full text-sm font-bold">
                      {b.nickname.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{b.nickname}</p>
                      <p className="text-muted-foreground text-xs">{b.full_name}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(b.id)}>
                    <Trash2 className="text-muted-foreground size-4" />
                  </Button>
                </div>
                <div className="mt-4 space-y-1 text-xs">
                  <p className="text-muted-foreground font-mono">
                    {maskAccount(b.account_number)}
                  </p>
                  <p className="text-muted-foreground">
                    {b.bank_name} · {b.ifsc}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary">{b.transfer_type}</Badge>
                  {b.is_verified && (
                    <Badge className="bg-success/10 text-success gap-1 hover:bg-success/10">
                      <BadgeCheck className="size-3" /> Verified
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {list.length === 0 && (
            <Card className="shadow-soft md:col-span-2 xl:col-span-3">
              <CardContent className="text-muted-foreground p-10 text-center">
                No beneficiaries yet — add your first payee.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
