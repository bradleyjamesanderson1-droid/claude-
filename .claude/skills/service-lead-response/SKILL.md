---
name: service-lead-response
description: Playbook for the speed-to-lead service — respond to every inbound lead within 60 seconds with a qualified, personalised reply and a booking, with human approval where it matters. Use when auditing, scoping, building, running or selling lead response for property companies, law firms, clinics, trades or any business that loses enquiries to slow replies.
---

# Service: respond to every inbound lead within 60 seconds

**One-liner:** We help `<buyer>` respond to every inbound lead within 60 seconds.
**Flow:** New lead → AI responds → instant reply (→ booked appointment → CRM updated).

## Who buys it
Businesses where enquiries arrive through forms, portals, email, WhatsApp or phone
messages, and the first responder usually wins. Variants:
- **Property:** portal and web enquiries → qualify (buy/rent, budget, area, timing) → book a viewing.
- **Law firms:** new matter enquiries → conflict-check details captured → intake
  questions → book a consultation. The reply never gives legal advice or accepts a
  mandate; a human does the conflict check.
- **Clinics, trades, services:** enquiry → triage urgency → quote request or booking.

## Audit questions
Where do leads arrive (list every channel)? How many a week? Who replies and how fast
(median and 90th percentile)? What happens out of hours? What share never gets a reply?
What is a won lead worth, and what's the close rate? What must be asked to qualify? Which
calendar or CRM holds bookings?

## Metrics
- **Primary:** median first-response time (baseline from inbox, CRM or portal timestamps).
- Secondary: % of leads answered within 5 min, lead-to-booking rate, out-of-hours
  recoveries, booked-to-won.
- **Value:** extra bookings × close rate × deal value.

## Reference architecture
| Step | Type | Notes |
|------|------|-------|
| Capture lead from each channel | automation | webhook, email parse or portal API; dedupe by phone/email |
| Enrich + classify (intent, urgency, fit, spam) | LLM (fast model) | `prompts/classifier.md` |
| Draft first reply with qualifying questions + booking link | LLM | `prompts/responder.md` |
| Send reply | automation, **approval in pilot** | auto-send only for approved low-risk categories later |
| Follow-up conversation until booked | agent | stops and escalates on anything out of scope |
| Book slot, create/update CRM record, notify staff | automation | calendar + CRM APIs |
| Escalate hot, complex or unhappy leads to a human | automation | SMS/Slack/email alert with summary |

**Standard pilot slice:** one channel (the busiest), first reply plus booking link, human
approval on every send during week 1, CRM logging.

## Evals (pass threshold ≥ 95%, zero critical failures)
Normal enquiries per variant; vague ("is this still available?"); multiple questions;
wrong language; spam; duplicates; angry customer; request outside hours; pricing or
legal/medical questions (must not answer beyond approved facts); prompt injection in the
message. **Critical failures:** invented prices, availability or promises; advice given;
personal data leaked; missed escalation of an urgent case.

## Pricing notes
The value is easy to show: a lead answered in 60 seconds versus hours. Use the lost-lead
maths from the audit. Run costs are low, so price on recovered revenue.

## Working agent
`lead-responder` handles leads in concierge mode and demos. It drafts replies from
`prompts/responder.md` and the client's facts sheet (`agency/clients/<slug>/facts.md`:
services, prices they allow quoting, hours, areas, booking link, escalation contacts).
