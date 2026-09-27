---
name: position-offer
description: Turn a validated workflow into sharp agency positioning — one buyer, one expensive workflow, one measurable outcome — replacing generic "we build AI automations for businesses" language. Use after a workflow passes validation, or when the user asks for a positioning line, bio, homepage headline, outreach hook or elevator pitch.
---

# Position the offer

Rule: **don't pick an AI niche, pick one expensive workflow.** Positioning names the
buyer, the workflow and the result, never the technology.

## Inputs
Read `agency/workflows/<slug>/scorecard.md`. If it's missing, run `validate-problem` first.

## Build the one-liner

Template: **We help `<specific buyer>` `<verb the outcome>` `<measurable qualifier>`.**

Reference patterns:
- We help property companies **respond to every inbound lead within 60 seconds.**
  (New lead → AI responds → instant reply)
- We help B2B teams **research + personalise outbound automatically.**
  (Find prospects → research & personalise → send outreach)
- We automate Tier-1 support **while escalating the cases AI shouldn't touch.**
  (Customer query → AI handles common issues → escalate complex cases)

Write 3–5 options, then check each one:
- [ ] A buyer could say "that's us" or "that's not us" within five seconds
- [ ] The outcome is a number or a time, not an adjective ("faster", "smarter")
- [ ] No "AI", "agents" or "automation" needed to understand it (fine to add, not to depend on)
- [ ] It includes a trust boundary when the work is risky (escalation, human approval)
- [ ] It matches the scorecard's metric

Pick one and explain why.

## Also produce
- **3-step flow** (trigger → AI step → result), used on the website and in the pitch diagram.
- **Before/after line:** "Today <pain in their words>. After: <outcome>."
- **Outreach hook** (≤ 2 sentences) that opens with their cost, not your tool.
- **Anti-positioning:** 3 things you will *not* do for this buyer, to stay narrow.

Write everything to `agency/workflows/<slug>/positioning.md`, update the README one-liner and
set `status: positioned`.
