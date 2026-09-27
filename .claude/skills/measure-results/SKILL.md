---
name: measure-results
description: Measure a live pilot against its baseline and report results to the client honestly — before vs after on the agreed metric, quality, cost and ROI — then recommend expand, adjust or stop. Use at the end of a pilot, for a client results report, or when the user asks "did it work?".
---

# Measure the result

Use the **same measurement method** as the baseline. A different method makes the
comparison worthless.

## Steps
1. Collect "after" data for the pilot period (logs from `pilot/build/`, client system
   exports) into `agency/clients/<slug>/results/raw/`.
2. Run the `results-analyst` subagent. It computes before vs. after, quality (approval-
   without-edit rate, escalations, errors), run cost and ROI, and flags anything
   confounding the result (seasonality, staff changes, volume shifts).
3. Write `results-report.md` for the client:
   - **Headline:** metric from baseline → result (target was X).
   - **What the system did:** volumes handled, escalated and approved.
   - **Quality:** edit rate, errors caught, incidents.
   - **Money:** value created vs. fees and run cost, and the payback period.
   - **What we learned.**
   - **Recommendation:** *expand* (next slice plus retainer), *adjust* (what changes and
     why) or *stop* (honest reasons).
4. If the result is good and the client consents, run `case-study-writer` for a case study.
   Anonymise it if they don't want to be named.
5. On expand, move to `retainer-ops`. Set `phase: retainer`.

Never round results up. A missed target reported honestly, with a clear fix, keeps the
client. A padded one loses them when they check.
