export const inr = (
  value: number | string | null | undefined,
  compact = false
) => {
  const n = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: compact ? 1 : 2,
    minimumFractionDigits: compact ? 0 : 2,
    notation: compact ? "compact" : "standard",
  }).format(n);
};

export const maskAccount = (acc: string) => {
  if (!acc) return "XXXX XXXX XXXX";

  return `XXXX XXXX ${acc.slice(-4)}`;
};

export const shortDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

export const longDateTime = (d: string | Date) =>
  new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const categoryLabel = (c: string) => {
  if (!c) return "Other";

  return c.charAt(0).toUpperCase() + c.slice(1);
};