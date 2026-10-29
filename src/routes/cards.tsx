import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Snowflake,
  Globe,
  Wifi,
  CreditCard as CardIcon,
} from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

import { supabase } from "@/integrations/supabase/client";
import {
  useCards,
  useRefreshBanking,
  type Card as BankCard,
} from "@/lib/banking";

import { inr } from "@/lib/formats";

export const Route = createFileRoute("/cards")({
  head: () => ({
    meta: [
      {
        title: "Card Controls | Nexa Smart Banking",
      },
      {
        name: "description",
        content:
          "Freeze cards instantly, set ATM and POS limits, and control online or international usage.",
      },
      {
        property: "og:title",
        content: "Card Controls | Nexa Smart Banking",
      },
      {
        property: "og:description",
        content: "Full control over every Nexa card.",
      },
    ],
  }),

  component: CardsPage,
});

// =====================================================
// CARD VISUAL
// =====================================================

function CardVisual({ card }: { card: BankCard }) {
  /*
   * First card = Credit  = KOMAL YADAV
   * Second card = Debit  = PATHAK
   */
  const holderName =
    card.card_type === "credit"
      ? "KOMAL YADAV"
      : "PATHAK";

  return (
    <div className="relative aspect-[1.6/1] w-full overflow-hidden rounded-2xl bg-gradient-card-premium p-5 shadow-elevated">

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-70" />

      <div className="relative flex h-full flex-col justify-between">

        {/* ================================================= */}
        {/* TOP */}
        {/* ================================================= */}

        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-navy-foreground/60">
              Nexa {card.card_type}
            </p>

            <p className="font-display text-sm font-bold text-navy-foreground">
              {card.card_type === "credit"
                ? "Infinite Rewards"
                : "Edge Platinum"}
            </p>
          </div>

          <Wifi className="size-5 rotate-90 text-navy-foreground/70" />
        </div>

        {/* ================================================= */}
        {/* CARD NUMBER */}
        {/* ================================================= */}

        <div>
          <div className="mb-3 h-7 w-11 rounded-md bg-[linear-gradient(135deg,oklch(0.85_0.12_85),oklch(0.7_0.13_70))]" />

          <p className="font-mono text-lg tracking-widest text-navy-foreground">
            {card.card_number_masked}
          </p>
        </div>

        {/* ================================================= */}
        {/* BOTTOM */}
        {/* ================================================= */}

        <div className="flex items-end justify-between">

          {/* CARD HOLDER */}
          <div>
            <p className="text-[9px] uppercase text-navy-foreground/50">
              Card holder
            </p>

            <p className="text-xs font-semibold text-navy-foreground">
              {holderName}
            </p>
          </div>

          {/* VALID THRU */}
          <div>
            <p className="text-[9px] uppercase text-navy-foreground/50">
              Valid thru
            </p>

            <p className="text-xs font-semibold text-navy-foreground">
              {card.expiry}
            </p>
          </div>

          {/* NETWORK */}
          <p className="font-display text-sm font-bold italic text-navy-foreground">
            {card.network}
          </p>
        </div>
      </div>

      {/* ================================================= */}
      {/* FROZEN OVERLAY */}
      {/* ================================================= */}

      {card.is_frozen && (
        <div className="absolute inset-0 flex items-center justify-center bg-navy/70 backdrop-blur-[3px]">

          <Badge className="gap-1 bg-primary text-primary-foreground">
            <Snowflake className="size-3" />
            Frozen
          </Badge>

        </div>
      )}
    </div>
  );
}

// =====================================================
// CARD CONTROLS
// =====================================================

function CardControls({ card }: { card: BankCard }) {
  const refresh = useRefreshBanking();

  const [atm, setAtm] = useState(
    Number(card.daily_atm_limit ?? 0)
  );

  const [pos, setPos] = useState(
    Number(card.daily_pos_limit ?? 0)
  );

  // ===================================================
  // UPDATE CARD
  // ===================================================

  const update = async (
    patch: Partial<{
      is_frozen: boolean;
      online_enabled: boolean;
      intl_enabled: boolean;
      daily_atm_limit: number;
      daily_pos_limit: number;
    }>,
    message: string,
  ) => {
    const { error } = await supabase
      .from("cards")
      .update(patch)
      .eq("id", card.id);

    if (error) {
      console.error("Card update error:", error);

      toast.error(error.message);

      return;
    }

    toast.success(message);

    refresh();
  };

  return (
    <Card className="shadow-soft">

      <CardContent className="space-y-5 p-5">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex items-center justify-between">

          <div>
            <p className="font-semibold">
              Card controls
            </p>

            <p className="text-xs text-muted-foreground">
              {card.card_type === "credit"
                ? `Limit ${inr(
                    Number(card.credit_limit ?? 0),
                  )} · Outstanding ${inr(
                    Number(card.outstanding ?? 0),
                  )}`
                : "Linked to your savings account"}
            </p>
          </div>

          <Button
            variant={card.is_frozen ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() =>
              update(
                {
                  is_frozen: !card.is_frozen,
                },
                card.is_frozen
                  ? "Card unfrozen"
                  : "Card frozen instantly",
              )
            }
          >
            <Snowflake className="size-4" />

            {card.is_frozen
              ? "Unfreeze"
              : "Freeze"}
          </Button>

        </div>

        {/* ================================================= */}
        {/* ONLINE / E-COMMERCE */}
        {/* ================================================= */}

        <div className="flex items-center justify-between">

          <Label className="flex items-center gap-2 text-sm">

            <CardIcon className="size-4" />

            Online / e-commerce

          </Label>

          <Switch
            checked={Boolean(card.online_enabled)}
            onCheckedChange={(value) =>
              update(
                {
                  online_enabled: value,
                },
                "Online usage updated",
              )
            }
          />

        </div>

        {/* ================================================= */}
        {/* INTERNATIONAL */}
        {/* ================================================= */}

        <div className="flex items-center justify-between">

          <Label className="flex items-center gap-2 text-sm">

            <Globe className="size-4" />

            International usage

          </Label>

          <Switch
            checked={Boolean(card.intl_enabled)}
            onCheckedChange={(value) =>
              update(
                {
                  intl_enabled: value,
                },
                "International usage updated",
              )
            }
          />

        </div>

        {/* ================================================= */}
        {/* ATM LIMIT */}
        {/* ================================================= */}

        <div className="space-y-3">

          <div className="flex justify-between text-sm">

            <span>
              Daily ATM limit
            </span>

            <span className="tabular font-semibold">
              {inr(atm)}
            </span>

          </div>

          <Slider
            value={[atm]}
            min={0}
            max={100000}
            step={5000}
            onValueChange={(value) =>
              setAtm(value[0] ?? 0)
            }
            onValueCommit={(value) =>
              update(
                {
                  daily_atm_limit: value[0] ?? 0,
                },
                "ATM limit updated",
              )
            }
          />

        </div>

        {/* ================================================= */}
        {/* POS / ONLINE LIMIT */}
        {/* ================================================= */}

        <div className="space-y-3">

          <div className="flex justify-between text-sm">

            <span>
              Daily POS / online limit
            </span>

            <span className="tabular font-semibold">
              {inr(pos)}
            </span>

          </div>

          <Slider
            value={[pos]}
            min={0}
            max={500000}
            step={10000}
            onValueChange={(value) =>
              setPos(value[0] ?? 0)
            }
            onValueCommit={(value) =>
              update(
                {
                  daily_pos_limit: value[0] ?? 0,
                },
                "POS limit updated",
              )
            }
          />

        </div>

      </CardContent>
    </Card>
  );
}

// =====================================================
// CARDS PAGE
// =====================================================

function CardsPage() {
  const {
    data: cards,
    isLoading,
    error,
  } = useCards();

  // ===================================================
  // LOADING
  // ===================================================

  if (isLoading) {
    return (
      <AppShell
        title="Cards"
        subtitle="Freeze, limit and control every card in real time"
      >
        <div className="grid gap-6 lg:grid-cols-2">

          {[1, 2].map((item) => (
            <div
              key={item}
              className="space-y-4"
            >
              <div className="aspect-[1.6/1] animate-pulse rounded-2xl bg-muted" />

              <div className="h-64 animate-pulse rounded-2xl bg-muted" />
            </div>
          ))}

        </div>
      </AppShell>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (error) {
    return (
      <AppShell
        title="Cards"
        subtitle="Freeze, limit and control every card in real time"
      >
        <Card className="border-red-200 bg-red-50">

          <CardContent className="flex min-h-[250px] flex-col items-center justify-center text-center">

            <div className="mb-4 rounded-full bg-red-100 p-4">

              <CardIcon className="size-8 text-red-600" />

            </div>

            <h2 className="text-lg font-semibold text-red-700">
              Unable to load cards
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error instanceof Error
                ? error.message
                : "Please check your database connection and try again."}
            </p>

          </CardContent>

        </Card>
      </AppShell>
    );
  }

  // ===================================================
  // EMPTY
  // ===================================================

  if (!cards || cards.length === 0) {
    return (
      <AppShell
        title="Cards"
        subtitle="Freeze, limit and control every card in real time"
      >
        <Card className="shadow-soft">

          <CardContent className="flex min-h-[300px] flex-col items-center justify-center text-center">

            <div className="mb-5 rounded-full bg-muted p-5">

              <CardIcon className="size-8 text-muted-foreground" />

            </div>

            <h2 className="text-lg font-semibold">
              No cards available
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              No debit or credit cards are available for this account.
            </p>

          </CardContent>

        </Card>
      </AppShell>
    );
  }

  // ===================================================
  // CARDS
  // ===================================================

  return (
    <AppShell
      title="Cards"
      subtitle="Freeze, limit and control every card in real time"
    >
      <div className="grid gap-6 lg:grid-cols-2">

        {cards.map((card) => (
          <div
            key={card.id}
            className="space-y-4"
          >

            <CardVisual card={card} />

            <CardControls card={card} />

          </div>
        ))}

      </div>
    </AppShell>
  );
}