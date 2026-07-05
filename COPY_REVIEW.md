# COPY_REVIEW — the 10 highest-stakes strings

Per the brief (§8): these need sign-off before launch. Everything else in the
app follows the same voice rules (calm, wry, mechanism-first; banned-word list
enforced) but doesn't need line-item approval.

| # | Where | String | Notes |
|---|-------|--------|-------|
| 1 | Landing headline | "The weekly ritual for people who've abandoned every planner they've ever bought." | Straight from the brief's direction. |
| 2 | Landing subline | "Five minutes, once a week. Close out the week without judgment, pick three things that matter, and remove what's most likely to stop you. No streaks. No scores. No starting over." | |
| 3 | Step 2 post-archive microcopy | "Gone. Not failed — finished with. Next week starts clean." | The emotional core of the app. |
| 4 | Step 3 fourth-priority refusal | "That's the old system talking. Three." | Wry, not preachy — appears only if the user taps "add a fourth?". |
| 5 | Email capture block | "Want this saved? Enter your email and I'll keep your reset history here, send you this card, and send the Notion version of the ritual so it lives inside your workspace." | The main conversion moment. |
| 6 | Consent checkbox | "Also send me occasional Undisciplined emails about systems that survive imperfect weeks. Optional — your card and history arrive either way. Unsubscribe anytime." | POPIA: unticked by default, separate from transactional. |
| 7 | Product bridge | "The Weekly Reset closes the week. The Forgiving Habit Tracker runs the days in between — same mechanism, built to survive missed days. R180." | |
| 8 | Done-page empty state (no last reset) | "No reset here yet. Five minutes, whenever suits you." | |
| 9 | Empty-priorities card line | "A quiet week. That counts too." | Shown on the card if all three priorities were left blank. |
| 10 | Welcome-back line (`/history`, Phase 2) | "Welcome back. The system didn't go anywhere." | From the brief §3.4 — reserved for the subscriber area. |

## Open copy decisions
- Contact address is placeholdered as `hello@undisciplined.co` in the footer,
  privacy, and terms pages — replace once the domain is confirmed.
- Step 5 currently notes "Email reminders arrive once saving is switched on"
  in place of the "Email me a reminder" capture option; the full option ships
  with Phase 2 (it needs Resend + Supabase).
