import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/* =========================================================
   HELPERS
========================================================= */

const num = (value: unknown, fallback = 0): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
};

const abs = (value: unknown) => Math.abs(num(value));

const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("User not authenticated");
  return data.user;
};

const getDirection = (
  type: unknown,
  amount: unknown,
): "credit" | "debit" => {
  const t = String(type ?? "").toLowerCase();
  if (t === "credit" || t === "debit") return t;
  return num(amount) < 0 ? "debit" : "credit";
};

const normalizeTxn = (row: any): Txn => {
  const direction = getDirection(row?.transaction_type, row?.amount);
  return {
    ...row,
    amount: abs(row?.amount),
    transaction_type: direction,
    direction,
    reference_id: row?.reference_id ?? null,
    reference: row?.reference_id ?? row?.reference ?? null,
    balance_after:
      row?.balance_after == null ? null : num(row.balance_after),
  };
};

const depositMaturity = (
  principal: unknown,
  rate: unknown,
  startDate: unknown,
  maturityDate: unknown,
) => {
  const p = abs(principal);
  const r = num(rate);
  if (p <= 0) return 0;
  if (r <= 0) return Number(p.toFixed(2));

  const start = new Date(String(startDate ?? new Date().toISOString()));
  const end = new Date(
    String(
      maturityDate ??
        new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    ),
  );

  const days = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 86400000),
  );
  const months = Math.max(1, Math.round(days / 30));

  return Number(
    (p * Math.pow(1 + r / 100 / 4, 4 * (months / 12))).toFixed(2),
  );
};

/* =========================================================
   TYPES
========================================================= */

export type Account = {
  id: string;
  user_id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  ifsc: string;
  account_type: string;
  balance: number;
  created_at: string;
  nickname?: string;
  branch?: string;
  currency?: string;
  is_primary?: boolean;
  status?: string;
};

export type Txn = {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  transaction_type: string;
  direction: "credit" | "debit";
  mode: string;
  category: string;
  status?: string;
  reference_id?: string | null;
  reference?: string | null;
  account_id?: string | null;
  balance_after?: number | null;
  counterparty?: string | null;
  created_at: string;
};

export type Beneficiary = {
  id: string;
  user_id: string;
  nickname: string;
  full_name: string;
  account_number: string;
  ifsc: string;
  bank_name: string;
  transfer_type: string;
  is_verified: boolean;
  created_at?: string;
};

export type Card = {
  id: string;
  user_id: string;
  account_id?: string | null;
  card_number_masked: string;
  network: string;
  card_type: string;
  holder_name: string;
  expiry: string;
  credit_limit: number;
  outstanding: number;
  daily_atm_limit: number;
  daily_pos_limit: number;
  online_enabled: boolean;
  intl_enabled: boolean;
  is_frozen: boolean;
  created_at?: string;
};

export type Bill = {
  id: string;
  user_id: string;
  biller_name: string;
  category: string;
  consumer_number: string;
  amount: number;
  due_date: string;
  autopay: boolean;
  status: string;
  paid_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Deposit = {
  id: string;
  user_id: string;
  deposit_name: string;
  deposit_type: string;
  principal: number;
  interest_rate: number;
  tenure_months: number;
  maturity_amount: number;
  start_date: string;
  maturity_date: string | null;
  status: string;
  created_at?: string;
};

export type Profile = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  customer_id: string;
  address: string | null;
  city: string | null;
  kyc_status: string;
  daily_limit: number;
  monthly_limit: number;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

/* =========================================================
   PROFILE
========================================================= */

export const useProfile = () =>
  useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        if (error.code === "42P01") return null;
        throw new Error(error.message);
      }
      if (!data) return null;

      return {
        ...(data as any),
        daily_limit: num((data as any).daily_limit),
        monthly_limit: num((data as any).monthly_limit),
      } as Profile;
    },
    staleTime: 10000,
  });

/* =========================================================
   ACCOUNTS
   Actual table: accounts
========================================================= */

export const useAccounts = () =>
  useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const user = await getCurrentUser();

      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      return ((data ?? []) as any[]).map((a) => ({
        ...a,
        account_name: a.account_name ?? a.nickname ?? "Nexa Savings Account",
        nickname: a.nickname ?? a.account_name ?? "Nexa Savings Account",
        bank_name: a.bank_name ?? "Nexa Smart Banking",
        balance: num(a.balance),
      })) as Account[];
    },
    staleTime: 5000,
  });

export const useTotalBalance = () => {
  const { data: accounts = [], ...query } = useAccounts();
  const totalBalance = accounts.reduce((s, a) => s + num(a.balance), 0);
  return { ...query, data: totalBalance, totalBalance, accounts };
};

/* =========================================================
   TRANSACTIONS
========================================================= */

export const useTransactions = (limit = 200) => {
  useBankingRealtime();

  return useQuery({
    queryKey: ["transactions", limit],
    queryFn: async () => {
      const user = await getCurrentUser();

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);

      return ((data ?? []) as any[]).map(normalizeTxn);
    },
    staleTime: 3000,
  });
};

/* =========================================================
   BENEFICIARIES
========================================================= */

export const useBeneficiaries = () =>
  useQuery({
    queryKey: ["beneficiaries"],
    queryFn: async () => {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from("beneficiaries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as Beneficiary[];
    },
  });

/* =========================================================
   CARDS
========================================================= */

export const useCards = () =>
  useQuery({
    queryKey: ["cards"],
    queryFn: async () => {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42P01") return [];
        throw new Error(error.message);
      }

      return ((data ?? []) as any[]).map((c) => ({
        ...c,
        credit_limit: num(c.credit_limit),
        outstanding: num(c.outstanding),
        daily_atm_limit: num(c.daily_atm_limit),
        daily_pos_limit: num(c.daily_pos_limit),
      })) as Card[];
    },
  });

/* =========================================================
   BILLS
========================================================= */

export const useBills = () =>
  useQuery({
    queryKey: ["bills"],
    queryFn: async () => {
      const user = await getCurrentUser();
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true });

      if (error) throw new Error(error.message);

      return ((data ?? []) as any[]).map((b) => ({
        ...b,
        amount: abs(b.amount),
        autopay: Boolean(b.autopay),
      })) as Bill[];
    },
    staleTime: 5000,
  });

export const useAddBill = () => {
  const refresh = useRefreshBanking();

  return useMutation({
    mutationFn: async (input: {
      billerName: string;
      category: string;
      consumerNumber: string;
      amount: number;
      dueDate?: string;
      autopay?: boolean;
    }) => {
      const user = await getCurrentUser();
      const amount = abs(input.amount);

      if (!input.billerName.trim()) throw new Error("Biller name is required");
      if (!input.consumerNumber.trim())
        throw new Error("Consumer number is required");
      if (amount <= 0) throw new Error("Bill amount must be greater than zero");

      const dueDate =
        input.dueDate ??
        new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("bills")
        .insert({
          user_id: user.id,
          biller_name: input.billerName.trim(),
          category: input.category || "electricity",
          consumer_number: input.consumerNumber.trim(),
          amount,
          due_date: dueDate,
          autopay: Boolean(input.autopay),
          status: "due",
        })
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return data as Bill;
    },
    onSuccess: refresh,
  });
};

export const useUpdateBill = () => {
  const refresh = useRefreshBanking();

  return useMutation({
    mutationFn: async (input: {
      billId: string;
      billerName?: string;
      category?: string;
      consumerNumber?: string;
      amount?: number;
      dueDate?: string;
      autopay?: boolean;
    }) => {
      const user = await getCurrentUser();
      const updateData: Record<string, unknown> = {};

      if (input.billerName !== undefined)
        updateData.biller_name = input.billerName.trim();
      if (input.category !== undefined) updateData.category = input.category;
      if (input.consumerNumber !== undefined)
        updateData.consumer_number = input.consumerNumber.trim();
      if (input.amount !== undefined) {
        const amount = abs(input.amount);
        if (amount <= 0) throw new Error("Amount must be greater than zero");
        updateData.amount = amount;
      }
      if (input.dueDate !== undefined) updateData.due_date = input.dueDate;
      if (input.autopay !== undefined) updateData.autopay = Boolean(input.autopay);

      const { data, error } = await supabase
        .from("bills")
        .update(updateData)
        .eq("id", input.billId)
        .eq("user_id", user.id)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return data as Bill;
    },
    onSuccess: refresh,
  });
};

export const useToggleBillAutopay = () => {
  const refresh = useRefreshBanking();

  return useMutation({
    mutationFn: async (input: { billId: string; autopay: boolean }) => {
      const user = await getCurrentUser();

      const { data, error } = await supabase
        .from("bills")
        .update({ autopay: Boolean(input.autopay) })
        .eq("id", input.billId)
        .eq("user_id", user.id)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return data as Bill;
    },
    onSuccess: refresh,
  });
};

export const useDeleteBill = () => {
  const refresh = useRefreshBanking();

  return useMutation({
    mutationFn: async (billId: string) => {
      const user = await getCurrentUser();

      const { error } = await supabase
        .from("bills")
        .delete()
        .eq("id", billId)
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: refresh,
  });
};

/* =========================================================
   DEPOSITS
   Actual DB:
   principal_amount, interest_rate, start_date, maturity_date
========================================================= */

export const useDeposits = () => {
  useBankingRealtime();

  return useQuery({
    queryKey: ["deposits"],
    queryFn: async () => {
      const user = await getCurrentUser();

      const { data, error } = await supabase
        .from("deposits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42P01") return [];
        throw new Error(error.message);
      }

      return ((data ?? []) as any[]).map((d) => {
        const principal = abs(d.principal_amount);
        const interestRate = num(d.interest_rate);

        const start = d.start_date
          ? new Date(d.start_date)
          : new Date(d.created_at ?? Date.now());

        const end = d.maturity_date
          ? new Date(d.maturity_date)
          : start;

        const months = Math.max(
          1,
          Math.round(
            (end.getTime() - start.getTime()) / 86400000 / 30,
          ),
        );

        return {
          ...d,
          deposit_name: d.deposit_name ?? "Nexa Deposit",
          deposit_type: d.deposit_type ?? "Fixed Deposit",
          principal,
          interest_rate: interestRate,
          tenure_months: months,
          maturity_amount: depositMaturity(
            principal,
            interestRate,
            d.start_date ?? d.created_at,
            d.maturity_date,
          ),
          start_date: d.start_date ?? start.toISOString(),
          maturity_date: d.maturity_date ?? null,
          status: d.status ?? "active",
        } as Deposit;
      });
    },
    staleTime: 3000,
  });
};

/* =========================================================
   NOTIFICATIONS
========================================================= */

export const useNotifications = () =>
  useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const user = await getCurrentUser();

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        if (error.code === "42P01") return [];
        throw new Error(error.message);
      }

      return (data ?? []) as Notification[];
    },
  });

/* =========================================================
   REFRESH
========================================================= */

export const useRefreshBanking = () => {
  const queryClient = useQueryClient();

  return async (keys?: string[]) => {
    const refreshKeys = keys ?? [
      "profile",
      "accounts",
      "transactions",
      "beneficiaries",
      "cards",
      "bills",
      "deposits",
      "notifications",
      "dashboard-summary",
    ];

    // Invalidate AND immediately refetch inactive queries too.
    // This is important because Dashboard/Transactions may not be
    // the currently mounted page when a transfer is completed.
    await Promise.all(
      refreshKeys.map(async (key) => {
        await queryClient.invalidateQueries({
          queryKey: [key],
          refetchType: "all",
        });

        await queryClient.refetchQueries({
          queryKey: [key],
          type: "all",
        });
      }),
    );
  };
};

/* =========================================================
   TRANSFER
========================================================= */

export const useTransfer = () => {
  const refresh = useRefreshBanking();

  return useMutation({
    mutationFn: async (input: {
      from: string;
      amount: number;
      mode?: string;
      beneficiaryId?: string;
      toAccount?: string;
      remarks?: string;
    }) => {
      const amount = abs(input.amount);

      if (!input.from) {
        throw new Error("Please select a source account");
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Transfer amount must be greater than zero");
      }

      if (!input.beneficiaryId && !input.toAccount) {
        throw new Error(
          "Please select a beneficiary or destination account",
        );
      }

      const rpcPayload: Record<string, unknown> = {
        _from_account: input.from,
        _amount: amount,
        _mode: input.mode ?? "IMPS",
        _remarks: input.remarks ?? "",
        _category: "transfer",
      };

      if (input.beneficiaryId) {
        rpcPayload._beneficiary_id = input.beneficiaryId;
      }

      if (input.toAccount) {
        rpcPayload._to_account = input.toAccount;
      }

      const { data, error } = await supabase.rpc(
        "transfer_funds",
        rpcPayload,
      );

      if (error) {
        console.error("Transfer error:", error);
        throw new Error(error.message);
      }

      const result = (data ?? {}) as any;

      return {
        reference: String(result.reference ?? ""),
        balance: num(result.balance),
        party: String(result.party ?? ""),
        amount: abs(result.amount ?? amount),
      };
    },

    /*
     * Transfer is successful only after Supabase RPC succeeds.
     * Then immediately refresh the exact data used by:
     *   - account cards
     *   - Transactions page
     *   - Dashboard Recent Activity
     *   - Dashboard financial calculations
     */
    onSuccess: async () => {
      await refresh([
        "accounts",
        "transactions",
        "dashboard-summary",
        "notifications",
      ]);
    },
  });
};

/* =========================================================
   PAY BILL
========================================================= */

export const usePayBill = () => {
  const refresh = useRefreshBanking();

  return useMutation({
    mutationFn: async (input: { billId: string; from: string }) => {
      if (!input.billId) throw new Error("Bill ID is required");
      if (!input.from) throw new Error("Please select an account");

      const { data, error } = await supabase.rpc("pay_bill", {
        _bill_id: input.billId,
        _from_account: input.from,
      });

      if (error) throw new Error(error.message);

      const result = (data ?? {}) as any;

      return {
        reference: String(result.reference ?? ""),
        balance: num(result.balance),
      };
    },
    onSuccess: refresh,
  });
};

/* =========================================================
   OPEN FD / RD
========================================================= */

export const useOpenDeposit = () => {
  const refresh = useRefreshBanking();

  return useMutation({
    mutationFn: async (input: {
      from: string;
      principal: number;
      tenure: number;
      rate: number;
      type?: string;
    }) => {
      const principal = abs(input.principal);
      const tenure = Math.floor(num(input.tenure));
      const rate = num(input.rate);
      const type = String(input.type ?? "FD");

      if (!input.from) throw new Error("Please select an account");
      if (principal < 1000) throw new Error("Minimum deposit amount is ₹1,000");
      if (tenure <= 0) throw new Error("Invalid deposit tenure");
      if (rate < 0) throw new Error("Invalid interest rate");

      const { data, error } = await supabase.rpc("open_deposit", {
        _from_account: input.from,
        _principal: principal,
        _tenure_months: tenure,
        _rate: rate,
        _type: type,
      });

      if (error) throw new Error(error.message);

      const result = (data ?? {}) as any;

      return {
        id: String(result.id ?? ""),
        maturity_amount: num(
          result.maturity_amount,
          depositMaturity(
            principal,
            rate,
            new Date().toISOString(),
            new Date(
              Date.now() + tenure * 30 * 86400000,
            ).toISOString(),
          ),
        ),
        maturity_date: result.maturity_date ?? null,
      };
    },
    onSuccess: refresh,
  });
};

/* =========================================================
   NOTIFICATION MUTATIONS
========================================================= */

export const useMarkNotificationRead = () => {
  const refresh = useRefreshBanking();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const user = await getCurrentUser();

      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id)
        .select("*")
        .single();

      if (error) {
        if (error.code === "42P01") return null;
        throw new Error(error.message);
      }

      return data as Notification;
    },
    onSuccess: refresh,
  });
};

export const useMarkAllNotificationsRead = () => {
  const refresh = useRefreshBanking();

  return useMutation({
    mutationFn: async () => {
      const user = await getCurrentUser();

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        if (error.code === "42P01") return true;
        throw new Error(error.message);
      }

      return true;
    },
    onSuccess: refresh,
  });
};

/* =========================================================
   REALTIME
========================================================= */

const useBankingRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`nexa-banking-${Date.now()}-${Math.random()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "accounts" },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ["accounts"],
            refetchType: "all",
          });

          void queryClient.invalidateQueries({
            queryKey: ["dashboard-summary"],
            refetchType: "all",
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ["transactions"],
            refetchType: "all",
          });

          void queryClient.invalidateQueries({
            queryKey: ["dashboard-summary"],
            refetchType: "all",
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deposits" },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ["deposits"],
            refetchType: "all",
          });

          void queryClient.invalidateQueries({
            queryKey: ["dashboard-summary"],
            refetchType: "all",
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bills" },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ["bills"],
            refetchType: "all",
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

/* =========================================================
   DASHBOARD SUMMARY
========================================================= */

export type DashboardCategorySpend = {
  category: string;
  amount: number;
  percentage: number;
};

export type DashboardSummary = {
  totalBalance: number;
  monthlyIn: number;
  monthlyOut: number;
  monthlyNet: number;
  dailyTransferUsed: number;
  dailyTransferLimit: number;
  dailyTransferRemaining: number;
  dailyTransferPercentage: number;
  categorySpend: DashboardCategorySpend[];
  investedInDeposits: number;
  activeDepositCount: number;
  monthlyTransactions: Txn[];
  todayTransferTransactions: Txn[];
};

export const useDashboardSummary = () => {
  useBankingRealtime();

  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async (): Promise<DashboardSummary> => {
      const user = await getCurrentUser();

      const now = new Date();
      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      );
      const monthEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1,
      );
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const todayEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );

      const [
        accountsResult,
        profileResult,
        monthResult,
        todayResult,
        depositsResult,
      ] = await Promise.all([
        supabase
          .from("accounts")
          .select("balance")
          .eq("user_id", user.id),

        supabase
          .from("profiles")
          .select("daily_limit")
          .eq("id", user.id)
          .maybeSingle(),

        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", monthStart.toISOString())
          .lt("created_at", monthEnd.toISOString())
          .order("created_at", { ascending: false })
          .limit(1000),

        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", todayStart.toISOString())
          .lt("created_at", todayEnd.toISOString())
          .order("created_at", { ascending: false })
          .limit(500),

        supabase
          .from("deposits")
          .select("*")
          .eq("user_id", user.id),
      ]);

      if (accountsResult.error)
        throw new Error(accountsResult.error.message);

      if (
        profileResult.error &&
        profileResult.error.code !== "42P01"
      ) {
        throw new Error(profileResult.error.message);
      }

      if (
        monthResult.error &&
        monthResult.error.code !== "42P01"
      ) {
        throw new Error(monthResult.error.message);
      }

      if (
        todayResult.error &&
        todayResult.error.code !== "42P01"
      ) {
        throw new Error(todayResult.error.message);
      }

      if (
        depositsResult.error &&
        depositsResult.error.code !== "42P01"
      ) {
        throw new Error(depositsResult.error.message);
      }

      const monthlyTransactions =
        ((monthResult.data ?? []) as any[]).map(normalizeTxn);

      const todayTransactions =
        ((todayResult.data ?? []) as any[]).map(normalizeTxn);

      const todayTransferTransactions =
        todayTransactions.filter(
          (t) =>
            t.direction === "debit" &&
            String(t.category ?? "").toLowerCase() === "transfer",
        );

      const totalBalance =
        ((accountsResult.data ?? []) as any[]).reduce(
          (s, a) => s + num(a.balance),
          0,
        );

      const monthlyIn = monthlyTransactions
        .filter((t) => t.direction === "credit")
        .reduce((s, t) => s + abs(t.amount), 0);

      const monthlyOut = monthlyTransactions
        .filter((t) => t.direction === "debit")
        .reduce((s, t) => s + abs(t.amount), 0);

      const dailyTransferUsed =
        todayTransferTransactions.reduce(
          (s, t) => s + abs(t.amount),
          0,
        );

      const dailyTransferLimit = num(
        (profileResult.data as any)?.daily_limit,
      );

      const dailyTransferRemaining = Math.max(
        0,
        dailyTransferLimit - dailyTransferUsed,
      );

      const dailyTransferPercentage =
        dailyTransferLimit > 0
          ? Math.min(
              100,
              (dailyTransferUsed / dailyTransferLimit) * 100,
            )
          : 0;

      const categoryMap = new Map<string, number>();

      monthlyTransactions
        .filter((t) => t.direction === "debit")
        .forEach((t) => {
          const category =
            String(t.category ?? "").trim() || "Other";

          categoryMap.set(
            category,
            (categoryMap.get(category) ?? 0) + abs(t.amount),
          );
        });

      const categoryTotal = [...categoryMap.values()].reduce(
        (s, n) => s + n,
        0,
      );

      const categorySpend = [...categoryMap.entries()]
        .map(([category, amount]) => ({
          category,
          amount,
          percentage:
            categoryTotal > 0
              ? (amount / categoryTotal) * 100
              : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      const activeDeposits =
        ((depositsResult.data ?? []) as any[]).filter((d) => {
          const status = String(d.status ?? "active").toLowerCase();
          return !["closed", "matured", "cancelled", "canceled"].includes(
            status,
          );
        });

      const investedInDeposits = activeDeposits.reduce(
        (s, d) => s + abs(d.principal_amount),
        0,
      );

      return {
        totalBalance,
        monthlyIn,
        monthlyOut,
        monthlyNet: monthlyIn - monthlyOut,
        dailyTransferUsed,
        dailyTransferLimit,
        dailyTransferRemaining,
        dailyTransferPercentage,
        categorySpend,
        investedInDeposits,
        activeDepositCount: activeDeposits.length,
        monthlyTransactions,
        todayTransferTransactions,
      };
    },
    staleTime: 3000,
  });
};

/* =========================================================
   DASHBOARD CASHFLOW
========================================================= */

export type CashflowPoint = {
  date: string;
  label: string;
  credit: number;
  debit: number;
  net: number;
};

export const useDashboardCashflow = () => {
  const { data: summary, ...query } = useDashboardSummary();

  const points: CashflowPoint[] = [];

  if (summary) {
    const grouped = new Map<
      string,
      { credit: number; debit: number }
    >();

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      grouped.set(d.toISOString().slice(0, 10), {
        credit: 0,
        debit: 0,
      });
    }

    summary.monthlyTransactions.forEach((t) => {
      const key = new Date(t.created_at)
        .toISOString()
        .slice(0, 10);

      const bucket = grouped.get(key);
      if (!bucket) return;

      const amount = abs(t.amount);

      if (t.direction === "credit") bucket.credit += amount;
      else bucket.debit += amount;
    });

    for (const [date, values] of grouped.entries()) {
      const d = new Date(`${date}T00:00:00`);

      points.push({
        date,
        label: d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        credit: values.credit,
        debit: values.debit,
        net: values.credit - values.debit,
      });
    }
  }

  return {
    ...query,
    data: points,
    points,
    summary,
  };
};
