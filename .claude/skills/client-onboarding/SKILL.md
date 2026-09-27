---
name: client-onboarding
description: Onboard a new AI automation client — create their workspace, confirm scope and success metric, collect system access with least privilege, and set up lawful data handling (POPIA/GDPR). Use when a client says yes, when the user says "new client", or before any work touches client data.
---

# Client onboarding

## 1. Create the workspace
`agency/clients/<slug>/` with `engagement.md` (template in `service-delivery`). If the deal
came through the pipeline, copy the scope, price and success metric from
`agency/workflows/<workflow>/offer.md`. Don't re-negotiate them in onboarding.

## 2. Kickoff agenda (send in advance, 45 min)
1. Confirm the one workflow in scope and what is explicitly out of scope.
2. Confirm the success metric, the baseline source and the target date.
3. Name the approver (spend, go-live) and the day-to-day contact.
4. Walk through the current process live, screen-share if possible.
5. Agree on access, data rules and the weekly check-in slot.

Draft the kickoff email and the agenda for the user to send.

## 3. Access (`access.md`)
List every system the pilot touches (CRM, inbox, calendar, helpdesk, database, APIs):

| System | Why needed | Access level | Method | Granted by | Status |

Rules: ask for **read-only first** and write access only for the exact action the pilot
performs. Prefer a dedicated service account or API key over staff logins. Never store
credentials in this repo. Record only *where* they are kept (password manager or secrets store).

## 4. Data handling (`data-handling.md`)
- What personal information is processed, whose it is and why (lawful basis).
- Jurisdiction: in South Africa, **POPIA** applies (operator agreement, security safeguards,
  cross-border transfer when model providers process data abroad). Use GDPR for EU data
  subjects and the local equivalent elsewhere.
- Which data goes to which model provider, their retention settings and whether data is used
  for training (it should not be).
- Test data: anonymised or synthetic by default. Real data only with written consent.
- Retention and deletion at the end of the engagement.
- Regulated clients (legal, financial, medical) get extra notes on privilege, confidentiality
  and what must never be sent to a model.

Flag anything that needs a signed operator or data-processing agreement before work starts.

## 5. Done when
Scope, metric, approver, access and data handling are all confirmed. Set `phase: audit`
and log the date.
