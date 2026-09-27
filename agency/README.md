# Agency workspace

Working files for the AI agency pipeline. Each validated workflow gets a folder in
`workflows/<slug>/` that fills up stage by stage:

| Stage | File | Made by |
|-------|------|---------|
| 1. Validate the problem | `scorecard.md` | `/validate-problem` + `opportunity-scout` agent |
| 2. Position it | `positioning.md` | `/position-offer` |
| 3. Package the offer | `audit.md`, `offer.md` | `/design-offer` + `workflow-auditor` agent |
| 4. Design the stack | `architecture.md` | `/design-stack` + `solution-architect` agent |
| 5. Build proof | `build/`, `redteam-report.md`, `proof.md`, `case-study.md` | `/build-proof` + `red-team-tester` + `case-study-writer` agents |

Parked ideas (failed the 4-filter gate) go in `workflows/_parked.md` with the reason.

Start with `/ai-agency`. It finds the current stage and runs the next step.
The skills live in `.claude/skills/` and the agents in `.claude/agents/`. To use them in
every project, copy both folders into `~/.claude/`.

## Delivering the services

Once a client signs, `/service-delivery` runs the engagement in `clients/<slug>/`:

| Phase | Skill | Agents |
|-------|-------|--------|
| Onboard (scope, access, POPIA/GDPR) | `/client-onboarding` | none |
| Paid audit | `/run-audit` | `workflow-auditor` |
| Pilot build, harden, go live | `/deliver-pilot` | `solution-architect`, `pilot-builder`, `red-team-tester` |
| Measure | `/measure-results` | `results-analyst`, `case-study-writer` |
| Retainer + expansion | `/retainer-ops` | `ops-monitor` |

Service playbooks (audit questions, metrics, reference architecture, evals, deployable
prompts) and the agents that do the service work in concierge/demo mode:

| Service | Playbook | Agent |
|---------|----------|-------|
| Respond to every inbound lead within 60 seconds | `/service-lead-response` | `lead-responder` |
| Research + personalise outbound | `/service-outbound-research` | `prospect-researcher` |
| Tier-1 support with escalation | `/service-support-triage` | `support-triager` |

Each client needs a `facts.md` (template: `clients/_facts-template.md`). The working agents
only state what's in it.

## Winning clients: the outreach engine

`/outreach-engine` runs your own prospecting, nightly if scheduled:
research → three-line emails as **Gmail drafts** (max 20/day, you send) → sort every reply →
book the call (never send the price) → brief before each call.

| Piece | Skill | Agent |
|---|---|---|
| Write (three lines max) | `/write-cold-email` | `cold-email-writer` |
| Sort every reply | `/sort-replies` | `reply-sorter` |
| Book the call | `/book-the-call` | `reply-sorter`, `call-prep` |
| Research prospects | (from `service-outbound-research`) | `prospect-researcher` (research-only mode) |

The agents are given Gmail's **draft** tool but not its send or reply tools, so nothing goes out
without you. Fill in `facts.md` first: the run stops if `compliance_rule` is empty.
The pipeline lives in a Notion database, **Outreach Pipeline**, created during setup.

## The free-site play (local businesses with no website)

`/free-site-offer`: find them on Maps (`local-prospector`), build the site first
(`/website-builder` or the `site-builder` agent, which makes one self-contained `index.html`), call
("I couldn't find your site, want one, free? Just leave me a testimonial"), hand over and host it,
collect the testimonial, then offer paid services. Sites live in `sites/<slug>/`. With
`free_site_play: true` in `facts.md`, the nightly run builds sites and adds a call list to your digest.
