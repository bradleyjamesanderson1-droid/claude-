---
name: design-offer
description: Package an AI automation service as Workflow Audit → Paid Pilot → Measure → Expand, priced on business value and implementation risk. Use when the user needs a service package, pricing, a proposal, a pilot scope or a statement of work, or is about to start building before a client has agreed to pay.
---

# Design the offer

**Don't spend 3 weeks building something nobody agreed to buy.** Package the service first.

## Inputs
`scorecard.md` and `positioning.md` for the workflow. If there are notes, transcripts or
process docs from a real prospect, run the `workflow-auditor` subagent on them first. It
writes `audit.md`.

## The four-step package

1. **Workflow Audit** (fixed fee, short). Map how the process works today, find the
   baseline metric and pick the pilot section. Deliverable: the audit report. The fee is
   credited to the pilot if they go ahead.
2. **Paid Pilot**. Automate **one tightly defined section**, not the whole process. Define:
   scope in / scope out, inputs, outputs, human-approval points, duration (2–4 weeks) and a
   **success metric with a target** agreed in writing.
3. **Measure the result**. Choose what matters: time saved, leads recovered, response
   time, conversion, tickets resolved. Same measurement method as the baseline.
4. **Expand**. Turn the pilot into the larger system plus a monthly retainer for
   monitoring, evals and ongoing optimisation.

## Pricing

Price on **business value and implementation risk**, never on the number of nodes.

- Value anchor = annual cost of the problem (from the scorecard) × share the pilot can
  realistically capture.
- Pilot price ≈ 10–20% of first-year value captured, adjusted up for risk (messy data,
  regulated domain, customer-facing actions) and down for a first case study.
- Retainer ≈ covers run costs (models, hosting, tooling) × 2–3, plus monitoring time.
- Always show the client: *cost of problem → expected improvement → price → payback period.*

## Output: `agency/workflows/<slug>/offer.md`

```markdown
# Offer: <workflow>
## Audit — <price>, <duration>
## Pilot — <price>, <duration>
Scope in: ... / Scope out: ...
Human approval at: ...
Success metric: <metric> from <baseline> to <target>, measured by <method>
## Expand — <retainer>/month
## Value math
<cost of problem> → <improvement> → <price> → payback in <n> weeks
## Risks & how the pilot contains them
## Proposal email (draft)
```

Gate: don't mark `status: offer-ready` until the success metric has a baseline and a target.
Tell the user if the baseline still needs collecting from the client.
