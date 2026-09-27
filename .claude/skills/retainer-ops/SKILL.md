---
name: retainer-ops
description: Run the monthly retainer for a live client automation — health check, eval re-runs, prompt and cost optimisation, monthly client report and expansion proposal for the next workflow slice. Use for monthly client reviews, when a live automation misbehaves, or when the user asks what to upsell a client next.
---

# Retainer operations

The retainer pays for keeping the system good: monitoring, evals and ongoing optimisation.

## Monthly cycle (`monthly/<yyyy-mm>.md`)
1. **Health:** run `ops-monitor` over the month's logs. It reports volume, error rate,
   latency, escalation rate, approval-without-edit rate, model spend and drift from last
   month.
2. **Evals:** re-run the eval set in `pilot/evals/`, and add this month's hard or
   mis-handled real cases (anonymised). The pass rate must not fall. If it does, fix it
   before anything else.
3. **Optimise** (pick at most two changes a month, each tested against the evals):
   - Prompt changes for recurring edit patterns
   - Model tiering: move steps to a cheaper model where evals still pass
   - Caching, batching or fewer calls where cost is high
   - Loosening approvals, following the rule in `deliver-pilot`
4. **Client report** (one page): the metric trend, volumes, notable cases, changes made,
   cost, and the next month's plan.
5. **Incidents:** anything that reached a customer wrongly gets a short incident note
   covering what happened, the impact, the fix and the new eval case added.

## Expansion (`expansion.md`, quarterly or when the pilot metric is consistently hit)
Look at the audit's other steps and "also found" list. Propose the next slice with the same
structure as the original offer: scope, metric, baseline, price and payback. One slice at a
time.
