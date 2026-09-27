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
