---
name: build-proof
description: Build proof before chasing clients — the smallest working version of a real workflow on realistic test data, deliberately broken and hardened, then recorded as a Before → System → After case study. Use when the user wants a demo, proof of concept, portfolio piece or case study, or wants to test or harden a build.
---

# Build proof before chasing clients

Now you have something concrete to sell instead of a PowerPoint about AI.

## The six steps

1. **Choose a real workflow.** Use the one in `agency/workflows/<slug>/`. Never a toy.
2. **Build the smallest working version.** Follow `architecture.md` milestones and cut
   anything that isn't needed to show the core before → after.
3. **Use realistic test data.** Generate or anonymise 20–50 records that look like the
   client's real inputs, including messy ones (typos, missing fields, odd formats,
   hostile or off-topic messages). Store them in `build/testdata/`. No real personal data
   without consent.
4. **Break it deliberately.** Run the `red-team-tester` subagent on the build and the test
   data. It returns a failure report.
5. **Fix the edge cases.** Work through the failures by severity. Re-run until no
   high-severity failures remain.
6. **Add human approval where failure matters.** Confirm every approval point from
   `architecture.md` exists and is logged.

## Record the result

Measure the same metric as the offer (e.g. response time, minutes per item, accuracy)
for **before** (manual baseline or estimate, labelled as such) and **after** (measured
on the test set). Write `proof.md`:

```markdown
# Proof: <workflow>
Before: <metric + how measured>
System: <step 1> → <step 2> → ... → <step n>   (e.g. Lead arrives → AI researches company → Qualifies lead → Drafts personalised reply → Human approves → CRM updates automatically)
After: <metric + how measured>
Test set: <n> records, <pass rate>, red-team findings fixed: <n>
Known limits: ...
Demo: <how to run it / recording link>
```

Then run the `case-study-writer` subagent to turn `proof.md` into `case-study.md`: a
one-page case study, a short post and a 60-second demo script. Set `status: proving`, or
`live` once a paying client uses it.

Be honest: label simulated results as simulated. Credibility is the whole asset.
