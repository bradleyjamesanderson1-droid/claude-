---
name: deliver-pilot
description: Build, test and launch a client's paid pilot automation — architecture, implementation, red-team hardening, go-live checklist, staff handover and run-book. Use in the pilot phase of an engagement, or when the user asks to build, deploy or launch an automation for a client.
---

# Deliver the pilot

Automate **one tightly defined section**. Scope creep is the main way a pilot fails.

## Week-by-week (adjust to the agreed duration)

**Week 1: design and concierge**
- Run `solution-architect` with the client's `audit-report.md` and the service playbook's
  reference architecture. Output: `pilot/architecture.md`.
- Start **concierge mode**: the service's working agent handles real inputs inside Claude
  Code with the user approving every output. Save each case (anonymised) to
  `pilot/evals/cases/` to build the eval set.

**Week 2: build**
- Run `pilot-builder` to implement the architecture in `pilot/build/`. It uses the
  playbook's prompts from `prompts/` as the starting point. Before writing model-calling
  code, load the `claude-api` skill for current SDK usage and model IDs.
- Every LLM step logs its input, output, model and latency. Every customer-facing or
  irreversible action goes through an approval queue.

**Week 3: harden**
- Run `red-team-tester` on the build and eval set. Fix all high-severity findings, then
  re-run the evals. Record the pass rate in `pilot/evals/results.md`.

**Week 4: go live and measure**
- Complete the go-live checklist, launch with approvals on, then move to `measure-results`.

## go-live.md checklist
- [ ] Eval pass rate meets the playbook threshold; no open high-severity red-team findings
- [ ] Human approval active on every action marked in the architecture
- [ ] Credentials in a secrets store; least-privilege access confirmed
- [ ] Logging and alerting on errors, with the user as the alert recipient
- [ ] Kill switch: one documented way to pause the automation and fall back to manual
- [ ] Baseline measurement method ready to reuse for the "after" measurement
- [ ] Client approver has signed off (name, date)
- [ ] Staff handover done: a one-page "how it works / what to do when" guide for their team
- [ ] Run-book in `pilot/runbook.md`: how to deploy, restart, update prompts, read logs

## Loosening approvals
Only after 2+ weeks live, and only for case types with ≥ 98% approval-without-edit, and only
with the client approver's written OK. Log every change in `engagement.md`.
