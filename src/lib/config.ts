// Public config, env-driven from day one (§13). Server-only secrets
// (Supabase service role, Resend key) are read where they're used, not here.

export const config = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://weeklyreset.example",
  stanStoreHabitTrackerUrl:
    process.env.NEXT_PUBLIC_STAN_STORE_HABIT_TRACKER_URL ?? "",
  stanStoreCalmBudgetUrl:
    process.env.NEXT_PUBLIC_STAN_STORE_CALM_BUDGET_URL ?? "",
};
