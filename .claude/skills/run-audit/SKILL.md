---
name: run-audit
description: Deliver the paid Workflow Audit to a client — map the current process, measure the baseline, cost the problem and recommend the pilot slice, as a client-facing report. Use in the audit phase of an engagement or when the user has client interview notes, SOPs or data exports to analyse.
---

# Run the paid audit

The audit is a paid product, not a sales call. The client should find it useful even if
they never buy the pilot.

## Steps
1. Load the service playbook for this client (see `service-delivery`). Its **audit
   questions** and **metrics** section tells you what to collect.
2. Gather raw material in `agency/clients/<slug>/audit/raw/`: interview notes or
   transcripts, SOPs, exported data (CRM, inbox or helpdesk timestamps), sample records.
3. Run the `workflow-auditor` subagent on that folder. It maps the process, computes the
   baseline and costs the problem.
4. Check its output: every number has a source or is marked as an estimate, and the
   recommended pilot slice matches the service playbook's standard scope, or the difference
   is explained.
5. Write the client-facing `audit-report.md`.

## audit-report.md structure (plain language, no jargon)
1. **Summary:** three sentences on what costs you money today and what we recommend.
2. **How the process works today:** diagram plus steps, and where time goes.
3. **Baseline:** the metric, its current value and how it was measured.
4. **What this costs you:** the arithmetic, with assumptions.
5. **Recommendation:** the pilot slice, what changes, where humans stay in control, the
   expected result and the price.
6. **Also found:** quick wins that need no AI (these build trust).
7. **Next step:** pilot start date and what we need from you.

Offer to export it as a Word or PDF document for sending. Set `phase: pilot` only once the
client approves the pilot.
