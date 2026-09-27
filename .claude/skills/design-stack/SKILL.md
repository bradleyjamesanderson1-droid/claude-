---
name: design-stack
description: Design the technical system for an AI automation pilot across the stack layers (reasoning, agent, workflow, business systems, safety/reliability), deciding step by step between plain automation and an agent. Use when the user asks how to build a workflow, which tools or models to use, whether something should be an agent, or wants an architecture or build plan.
---

# Design the stack

**Not everything should be an agent.** If the steps are predictable, use normal automation.
If judgment is required, introduce an agent.

## Inputs
`offer.md` (pilot scope) and `audit.md`, if present. Hand the design work to the
`solution-architect` subagent with those files. Review what it returns against the
checklist below before writing it out.

## Layers

| Layer | Choose from | Decide |
|-------|-------------|--------|
| Reasoning | Claude Opus 5.5 (hard judgment), Claude Fable 5.1, Claude Sonnet 5 / Haiku 4.5 (high volume, cheap), or other frontier models | Which steps need which tier, cost per run |
| Agent layer | Claude Agent SDK, Claude API tool use, OpenAI Agents API | Only for the judgment steps |
| Workflow layer | n8n, Make, custom code | Triggers, routing, retries, schedules |
| Business systems | CRM, email, calendar, database, company APIs | Read/write access needed, auth method |
| Safety / reliability | Logging, evals, permissions, human approvals | Where failure matters and who approves |

## Step classification

For each step in the pilot's process, record:
`step | predictable? | needs judgment? | → automation / agent / human | failure impact | approval?`

Rules of thumb:
- Deterministic transforms, routing and API calls → workflow layer.
- Reading messy inputs, drafting, classifying ambiguous cases, research → agent/LLM step.
- Irreversible or customer-facing actions where failure matters → human approval, at least
  during the pilot.
- Every LLM step gets a logged input/output and at least a small eval set.

## Output: `agency/workflows/<slug>/architecture.md`

Include a diagram (Mermaid flowchart), the step classification table, the chosen tools per
layer with the reason for each, data access and permissions needed from the client, the eval
plan (test cases, pass criteria), estimated run cost per month and a build plan in
milestones of about 1–3 days. Set `status: designed`.

When the user wants the build started, scaffold it in a new directory
(`agency/workflows/<slug>/build/`) and keep it the **smallest working version**.
