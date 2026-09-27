---
name: service-delivery
description: Hub for delivering a signed AI automation engagement to a client — onboarding, paid audit, pilot build, results measurement and monthly retainer. Use when the user has (or is about to have) a paying client, names a client under agency/clients/, asks "what's next for <client>", or wants to deliver one of the services (lead response, outbound research, support triage).
---

# Service delivery

The sales pipeline (`/ai-agency`) ends with a signed offer. This hub runs the client work.
Each client has a folder at `agency/clients/<client-slug>/` that records the engagement.

| # | Phase | Skill | Subagents | Output in `agency/clients/<slug>/` |
|---|-------|-------|-----------|-----------------------------------|
| 1 | Onboard | `client-onboarding` | none | `engagement.md`, `access.md`, `data-handling.md` |
| 2 | Audit (paid) | `run-audit` | `workflow-auditor` | `audit-report.md` |
| 3 | Pilot | `deliver-pilot` | `solution-architect`, `pilot-builder`, `red-team-tester` | `pilot/`, `go-live.md` |
| 4 | Measure | `measure-results` | `results-analyst`, `case-study-writer` | `results-report.md` |
| 5 | Expand + retain | `retainer-ops` | `ops-monitor` | `monthly/<yyyy-mm>.md`, `expansion.md` |

## Which service?

Every engagement uses one service playbook. Load it before phase 2:

| Service | Playbook skill | Working agent |
|---------|----------------|---------------|
| Respond to every inbound lead within 60 seconds | `service-lead-response` | `lead-responder` |
| Research + personalise outbound automatically | `service-outbound-research` | `prospect-researcher` |
| Tier-1 support with escalation of cases AI shouldn't touch | `service-support-triage` | `support-triager` |

If the client's workflow fits none of these, use the phases anyway and write a new playbook
from the audit, following the same structure as the existing ones.

## Running it

1. Read `agency/clients/<slug>/engagement.md` to find the current phase. The first phase
   without its output is next.
2. Run that phase's skill. Update `engagement.md` with status, the next action and the date.
3. **Concierge mode is allowed.** Before the automation is live, the working agent can run
   the service inside Claude Code on real inputs, with the user reviewing every output.
   It gets value to the client in week one and builds the eval set from real cases.
4. **Nothing reaches the client's customers without a human approval step** until the
   go-live checklist in `deliver-pilot` is signed off.

## engagement.md template

```markdown
# <Client name>
service: lead-response | outbound-research | support-triage | custom
phase: onboarding | audit | pilot | measuring | retainer | closed
contact: <name, role> · approver: <who signs off spend and go-live>
success metric: <metric> from <baseline> to <target> by <date>
fees: audit <x> · pilot <y> · retainer <z>/month
next action: <one step> (<date>)
## Log
- <date> — <what happened>
```
