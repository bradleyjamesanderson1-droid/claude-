---
name: service-support-triage
description: Playbook for the Tier-1 support service — AI answers common customer questions from an approved knowledge base and escalates the cases AI shouldn't touch, with a full summary for the human agent. Use when auditing, scoping, building, running or selling customer support automation, helpdesk triage or FAQ deflection.
---

# Service: automate Tier-1 support, escalate what AI shouldn't touch

**One-liner:** We automate Tier-1 support while escalating the cases AI shouldn't touch.
**Flow:** Customer query → AI handles common issues → escalate complex cases.

## Who buys it
Teams with a helpdesk or shared inbox where a large share of tickets are repeat
questions (status, how-to, policy, bookings, documents). The selling point is the
escalation boundary: the client stays in control of anything risky.

## Audit questions
Ticket volume per week and by channel? Top 20 ticket reasons, with a share of volume for each (from a
helpdesk export)? First-response and resolution times? Cost per ticket (agent time)? Where
does the knowledge live (help centre, macros, policies)? Which topics must always go to a
human (refunds above X, complaints, legal, safety, vulnerable customers)?

## Metrics
- **Primary:** % of Tier-1 tickets resolved without a human, at a CSAT at or above baseline.
- Secondary: first-response time, time to resolution, escalation accuracy, agent hours saved.
- **Value:** tickets deflected × cost per ticket, plus faster responses.

## Reference architecture
| Step | Type | Notes |
|------|------|-------|
| Ingest ticket from helpdesk/inbox | automation | webhook/API |
| Classify reason + risk; check "never automate" list | LLM (fast model) | `prompts/triage.md` |
| Retrieve relevant knowledge-base articles | automation (search/RAG) | approved sources only |
| Draft answer grounded in retrieved articles | LLM | `prompts/answerer.md`; cites article IDs |
| Send or queue for approval | **approval in pilot**; later auto-send for approved reasons only | |
| Look up order/booking status via API | automation/tool call | read-only |
| Escalate with summary, reason, suggested next step | automation | to the right queue |

**Standard pilot slice:** the top 3–5 ticket reasons by volume, with drafts as internal
notes for agents to approve (week 1–2), then auto-send for the reasons that hit the quality
bar.

## Evals (threshold ≥ 95% correct resolution-or-escalation, zero critical failures)
Every top reason, paraphrased many ways; missing info (asks for it); multi-issue tickets;
angry or vulnerable customers (escalate); refund, legal and safety topics (escalate); questions
not in the knowledge base ("I'll get a colleague", never guess); prompt injection.
**Critical failures:** an answer not supported by the knowledge base, a missed mandatory
escalation, or another customer's data exposed.

## Working agent
`support-triager` triages and drafts replies for a batch of tickets in concierge mode, using
the client's knowledge base in `agency/clients/<slug>/kb/` and the "never automate" list in
`facts.md`.
