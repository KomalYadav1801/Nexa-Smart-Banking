import { createServerFn } from "@tanstack/react-start";

export type InsightInput = {
  totals: { income: number; spend: number; net: number };
  categories: { category: string; amount: number }[];
  topMerchants: { name: string; amount: number }[];
};

export type InsightResult = {
  summary: string;
  health_score: number;
  insights: { title: string; detail: string; impact: "high" | "medium" | "low" }[];
  actions: string[];
};

const money = (value: number) => `₹${Math.round(Math.abs(value)).toLocaleString("en-IN")}`;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const num = (value: unknown) => (Number.isFinite(Number(value)) ? Number(value) : 0);

function localInsights(data: InsightInput): InsightResult {
  const income = Math.max(0, num(data.totals.income));
  const spend = Math.max(0, num(data.totals.spend));
  const net = num(data.totals.net) || income - spend;
  const savingsRate = income > 0 ? (net / income) * 100 : 0;

  const categories = [...(data.categories ?? [])]
    .map((x) => ({ category: x.category, amount: Math.max(0, num(x.amount)) }))
    .sort((a, b) => b.amount - a.amount);
  const merchants = [...(data.topMerchants ?? [])]
    .map((x) => ({ name: x.name, amount: Math.max(0, num(x.amount)) }))
    .sort((a, b) => b.amount - a.amount);

  let score = 70;
  if (income <= 0) score = 35;
  else {
    if (savingsRate >= 30) score += 20;
    else if (savingsRate >= 20) score += 12;
    else if (savingsRate >= 10) score += 5;
    else if (savingsRate < 0) score -= 25;
    else score -= 5;
    const spendRatio = spend / income;
    if (spendRatio <= 0.6) score += 5;
    else if (spendRatio > 0.9) score -= 12;
    if (categories[0] && categories[0].amount / income > 0.35) score -= 8;
  }
  score = Math.round(clamp(score, 0, 100));

  const insights: InsightResult["insights"] = [];
  if (income <= 0) {
    insights.push({ title: "No inflow detected", detail: "No positive income was found in the last 90 days, so the savings picture cannot be assessed reliably.", impact: "high" });
  } else {
    insights.push({ title: "Savings position", detail: `You kept ${money(Math.max(net, 0))} after ${money(spend)} of spending, giving you a ${Math.round(savingsRate)}% savings rate over 90 days.`, impact: savingsRate < 10 ? "high" : savingsRate < 20 ? "medium" : "low" });
  }

  if (categories[0]) {
    const share = income > 0 ? Math.round((categories[0].amount / income) * 100) : 0;
    insights.push({ title: `Largest spend: ${categories[0].category}`, detail: `${money(categories[0].amount)} went to ${categories[0].category}, about ${share}% of your income during this period.`, impact: share >= 30 ? "high" : share >= 20 ? "medium" : "low" });
  } else {
    insights.push({ title: "Spending categories", detail: "There is not enough categorized spending data to identify a dominant category.", impact: "low" });
  }

  if (merchants[0]) {
    insights.push({ title: "Top spending counterparty", detail: `${merchants[0].name} represents your largest grouped spending amount at ${money(merchants[0].amount)}.`, impact: income > 0 && merchants[0].amount / income >= 0.15 ? "high" : "medium" });
  } else {
    insights.push({ title: "Merchant concentration", detail: "No merchant or counterparty concentration was available in recent activity.", impact: "low" });
  }

  if (categories[1]) {
    insights.push({ title: "Next biggest opportunity", detail: `${categories[1].category} is your second-largest spending category at ${money(categories[1].amount)}. This is a useful area to review for savings.`, impact: categories[1].amount / Math.max(spend, 1) >= 0.2 ? "medium" : "low" });
  } else {
    insights.push({ title: "Cash-flow balance", detail: net >= 0 ? `Your cash flow is positive by ${money(net)} over the period.` : `Your cash flow is negative by ${money(net)} over the period.`, impact: net < 0 ? "high" : "low" });
  }

  const actions = [
    savingsRate < 10
      ? `Target an extra ${money(Math.max(500, spend * 0.05))} of monthly savings by trimming discretionary spending.`
      : `Keep your savings rate above ${Math.max(20, Math.round(savingsRate))}% and move part of the surplus into a dedicated savings goal.`,
    categories[0]
      ? `Review ${categories[0].category} transactions and try reducing that category by 10%, which could free about ${money(categories[0].amount * 0.1)} over 90 days.`
      : "Review transaction categories weekly so spending limits and alerts stay accurate.",
    merchants[0]
      ? `Review recurring or repeated payments involving ${merchants[0].name} and remove anything you no longer need.`
      : "Review recent transactions for repeated discretionary purchases.",
    categories[1]
      ? `Set a spending cap for ${categories[1].category} and review it weekly.`
      : "Set a weekly spending review to catch overspending early.",
  ];

  let summary = "Your recent cash flow is stable.";
  if (income <= 0) summary = "There is not enough positive income data in the last 90 days to judge financial health confidently.";
  else if (net < 0) summary = `Your spending exceeded inflow by ${money(net)} over the last 90 days.`;
  else if (savingsRate >= 25) summary = `Your cash flow is healthy, with ${Math.round(savingsRate)}% of inflow remaining after spending.`;
  else if (savingsRate >= 10) summary = `Your cash flow is positive, with ${Math.round(savingsRate)}% of inflow remaining after spending.`;
  else summary = `Your cash flow is positive, but only ${Math.round(savingsRate)}% of inflow remains after spending.`;

  return { summary, health_score: score, insights: insights.slice(0, 4), actions: actions.slice(0, 4) };
}

function extractJson(raw: string): string | null {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return start >= 0 && end > start ? cleaned.slice(start, end + 1) : null;
}

function normalizeResult(value: unknown): InsightResult {
  const source = (value ?? {}) as Partial<InsightResult>;
  const score = Number(source.health_score);
  const insights = Array.isArray(source.insights)
    ? source.insights.map((item) => {
        const x = item as Partial<InsightResult["insights"][number]>;
        const impact = x.impact === "high" || x.impact === "low" ? x.impact : "medium";
        return { title: String(x.title ?? "Insight"), detail: String(x.detail ?? ""), impact };
      }).filter((x) => x.title && x.detail).slice(0, 4)
    : [];
  const actions = Array.isArray(source.actions) ? source.actions.map(String).filter(Boolean).slice(0, 4) : [];
  if (typeof source.summary !== "string" || !Number.isFinite(score) || insights.length === 0 || actions.length === 0) {
    throw new Error("Could not parse AI response");
  }
  return { summary: source.summary, health_score: clamp(Math.round(score), 0, 100), insights: insights as InsightResult["insights"], actions };
}

async function callLovableAI(data: InsightInput, apiKey: string): Promise<InsightResult> {
  const prompt = [
    "You are Nexa, an Indian retail banking money coach. Analyse this customer's last 90 days.",
    `Income: INR ${data.totals.income}. Spend: INR ${data.totals.spend}. Net: INR ${data.totals.net}.`,
    `Category spend: ${data.categories.map((c) => `${c.category}: ${c.amount}`).join(", ")}.`,
    `Top counterparties: ${data.topMerchants.map((m) => `${m.name}: ${m.amount}`).join(", ")}.`,
    'Return JSON only: {"summary":string,"health_score":number,"insights":[{"title":string,"detail":string,"impact":"high"|"medium"|"low"}],"actions":[string]}.',
    "Give exactly 4 insights and 4 actions, concise and specific, with INR amounts where useful.",
  ].join("\n");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "user", content: prompt }], temperature: 0.2 }),
  });

  if (res.status === 429) throw new Error("Rate limit reached, please retry shortly");
  if (!res.ok) throw new Error(`AI service unavailable (${res.status})`);

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json.choices?.[0]?.message?.content ?? "";
  const payload = extractJson(raw);
  if (!payload) throw new Error("Could not parse AI response");
  return normalizeResult(JSON.parse(payload));
}

export const generateInsights = createServerFn({ method: "POST" })
  .inputValidator((data: InsightInput) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY?.trim();

    if (apiKey) {
      try {
        return await callLovableAI(data, apiKey);
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (message.includes("rate limit")) throw error;
        console.warn("Lovable AI unavailable; using local insights fallback.");
      }
    }

    return localInsights(data);
  });
