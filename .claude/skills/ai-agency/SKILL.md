---
name: ai-agency
description: Hub for building an AI automation agency one expensive workflow at a time. Use when the user wants to start, continue or review the agency pipeline (find a problem, position it, package the offer, design the stack, build proof), asks "what's next" for a workflow, or names a workflow under agency/workflows/. Routes to the stage skills and subagents in order.
---

# AI Agency pipeline

The playbook: **don't pick an AI niche, pick one expensive workflow.** The money is in the
workflow, not the label. Every workflow moves through five stages, and each stage leaves a
file behind in `agency/workflows/<slug>/`, so work can pause and pick up in any session.

| # | Stage | Skill | Subagents | Output file |
|---|-------|-------|-----------|-------------|
| 1 | Validate the problem | `validate-problem` | `opportunity-scout` | `scorecard.md` |
| 2 | Position it | `position-offer` | none | `positioning.md` |
| 3 | Package the offer | `design-offer` | `workflow-auditor` | `audit.md`, `offer.md` |
| 4 | Design the stack | `design-stack` | `solution-architect` | `architecture.md` |
| 5 | Build proof | `build-proof` | `red-team-tester`, `case-study-writer` | `proof.md`, `case-study.md` |

## How to run

1. **Find where we are.** List `agency/workflows/`. If the user named a workflow, read its
   files. The first missing output file is the current stage. With no workflows yet, start
   at stage 1. Before stage 1 is done, the user may only have a sector or a hunch.
2. **Run that stage's skill.** Follow its instructions fully, write its output file and
   update `agency/workflows/<slug>/README.md` (status line + one-paragraph summary).
3. **Respect the gates.** Don't advance past a stage that failed its gate:
   - Stage 1: the workflow must score **≥ 14/20 with no filter below 3**. Otherwise park it
     (`status: parked` and the reason) and score the next candidate.
   - Stage 3: there must be a priced pilot with a success metric agreed *before* building.
     "Don't spend 3 weeks building something nobody agreed to buy."
   - Stage 5: the build must have passed the red-team pass before any case study is written.
4. **End every run** by telling the user the stage just finished, the gate result and the
   single next action (usually one conversation with a real prospect).

## Workflow README template

```markdown
# <Workflow name>
status: validating | positioned | offer-ready | designed | proving | live | parked
buyer: <who pays>
one-liner: We help <buyer> <outcome> <in measurable terms>.
next action: <one concrete step>

<one-paragraph summary, updated each stage>
```

## Principles to hold the user to

- One buyer, one workflow, one metric at a time. Resist "we build AI automations for businesses."
- Automate workflows tied to **money, time or capacity**. If none moves, it's not worth selling.
- Not everything should be an agent: predictable steps get normal automation, and an agent
  only goes where judgment is required.
- Price on business value and implementation risk, never on how many nodes are in the workflow.
- Proof beats pitch: a working before → system → after beats a PowerPoint about AI.
