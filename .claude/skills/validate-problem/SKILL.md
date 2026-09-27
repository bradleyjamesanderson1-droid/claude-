---
name: validate-problem
description: Score a candidate business workflow against the four filters (Frequent, Expensive, Repeatable, Measurable) to decide whether it's a problem worth selling an AI automation for. Use when the user has a sector, a client or an idea and asks whether it's worth automating, wants candidate workflows found, or wants several ideas compared.
---

# Validate the problem

Goal: find a workflow that is attached to **money, time or capacity**, and prove it on paper
before anyone builds anything.

## 1. Get candidates

- If the user gives a sector or a type of company, run the `opportunity-scout` subagent
  with it. It returns 5–10 candidate workflows with evidence.
- If the user gives a specific workflow, use that one candidate.
- Prefer sectors the user already knows from the inside. Domain knowledge speeds up
  discovery calls and gives credibility.

## 2. Score each candidate (1–5 per filter, total /20)

| Filter | Question | 1 | 3 | 5 |
|--------|----------|---|---|---|
| **Frequent** (daily) | How often does it happen? | quarterly | weekly | many times a day |
| **Expensive** (cost) | What does it cost in money or staff time? | <1 hr/week | ~1 FTE-day/week | ≥1 FTE, or lost revenue |
| **Repeatable** (workflow) | Does it follow a recognisable process? | different every time | mostly the same, some judgment | same steps, clear inputs/outputs |
| **Measurable** (proof) | Can you prove before vs. after? | no baseline possible | baseline could be collected | baseline already exists (timestamps, CRM, tickets) |

Write the reason next to every score. Give a score without evidence 2 at most, and note what
evidence would raise it.

## 3. Estimate the cost of the problem

```
annual cost = occurrences/week × minutes each ÷ 60 × loaded hourly rate × 48
            + revenue lost (e.g. leads not answered in time × close rate × deal value)
```

State every assumption. This number is used later to price the offer.

## 4. Gate

- **Pass:** ≥ 14/20 and no filter below 3. Create `agency/workflows/<slug>/`, write
  `scorecard.md` and the workflow README (`status: validating`).
- **Fail:** record it in `agency/workflows/_parked.md` with the score and the reason, then move
  to the next candidate.

## scorecard.md format

```markdown
# Scorecard: <workflow>
Buyer: <role at company type>
| Filter | Score | Evidence |
|---|---|---|
| Frequent | x/5 | ... |
| Expensive | x/5 | ... |
| Repeatable | x/5 | ... |
| Measurable | x/5 | ... |
**Total:** xx/20 — PASS/FAIL
## Cost of the problem
<calculation with assumptions>
## Riskiest assumption
<the one thing to check with a real prospect first, and the question that checks it>
```
