---
name: service-outbound-research
description: Playbook for the research-and-personalise outbound service — find prospects matching an ICP, research each company, qualify it and draft genuinely personalised outreach for human approval before sending. Use when auditing, scoping, building, running or selling outbound prospecting automation for B2B teams (including the agency's own outreach).
---

# Service: research + personalise outbound automatically

**One-liner:** We help `<B2B teams>` research and personalise outbound automatically.
**Flow:** Find prospects → research & personalise → send outreach.

## Who buys it
B2B teams whose reps spend hours researching accounts, or who send generic sequences
that get ignored. The agency uses it for its own outbound too, which makes it the easiest
service to build proof for.

## Audit questions
What's the ICP (industry, size, region, trigger events)? Where do prospects come from
today (LinkedIn Sales Navigator, lists, CRM)? How long does a rep spend researching one
account? Current reply and meeting rates? Sending tool (e.g. Gmail/Outlook, sequencer)?
Compliance constraints (opt-out, POPIA/GDPR, CAN-SPAM, platform terms)?

## Metrics
- **Primary:** positive reply rate (or meetings booked per 100 prospects).
- Secondary: research minutes per account, accounts worked per rep per week, bounce rate.
- **Value:** extra meetings × meeting-to-deal rate × deal value, plus rep hours freed.

## Reference architecture
| Step | Type | Notes |
|------|------|-------|
| Pull prospects matching ICP | automation | from client lists or CRM or permitted data sources; dedupe against CRM |
| Research company + person | agent (web tools) | `prompts/researcher.md`; cite sources |
| Qualify against ICP, find a real hook | LLM | score 1–5; drop poor fits |
| Draft personalised email / message | LLM | `prompts/writer.md` |
| Human approves / edits | **human, always in pilot** | approval queue with research notes visible |
| Send + log in CRM, schedule follow-up | automation | respect opt-outs and send limits |

**Standard pilot slice:** 100–200 prospects from one ICP segment, research plus draft,
with 100% human approval before sending. Measure against the client's current sequence
(an A/B split if possible).

## Evals (threshold ≥ 90% "would send with light or no edits", zero critical failures)
Hook is true and specific (checked against the cited source); no fabricated facts, mutual
contacts or compliments; right person and company; no creepy personal details; poor-fit
prospects correctly dropped; short (under 120 words); one clear ask.
**Critical failures:** a fabricated fact, the wrong company, personal (non-business) data
used, or an opt-out ignored.

## Compliance
Scrape only from sources whose terms allow it. Use business contact data with a lawful basis
(legitimate interest assessment under POPIA/GDPR). Every message offers an opt-out, and
opt-outs are honoured across the whole system.

## Working agent
`prospect-researcher` researches a list of companies and drafts outreach in concierge
mode, reading the client's `agency/clients/<slug>/facts.md` (offer, ICP, proof points,
sender voice).
