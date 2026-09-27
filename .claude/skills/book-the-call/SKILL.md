---
name: book-the-call
description: Turn an interested or price-asking reply into a booked 10-minute call — never send the price, offer two concrete slots (tomorrow or the day after) from Google Calendar or the booking link, confirm the time, place a private calendar hold, and prepare a call brief. Use when a prospect wants to talk, asks the price, or picks a time.
---

# Book the call

**Never send the price.** Price depends on their setup, and the call is where you learn it.

## The booking reply (as a threaded Gmail draft)
Adapt this script without making it longer:

> Depends on your setup. 10 minutes walks through it.
> Tomorrow at <slot 1> or the day after at <slot 2>?

- **Slots:** use Google Calendar `suggest_time` on the user's calendar for the next two business
  days, within `call_hours` in `facts.md` (Africa/Johannesburg unless set otherwise), 15-minute
  duration, excluding weekends. Offer one slot per day. Write times with the time zone if the
  prospect is outside South Africa.
- If `facts.md` has a `booking_link` (e.g. Cal.com), add a line: "Or pick a time here: <link>".
- If they asked a question, answer it in one line first, then use the script.

## When they pick a time
1. Draft a confirmation in the thread: "Perfect, <day> at <time> it is. I'll call you on <number
   if given>, or send me the best number."
2. Put a **private hold** on the user's own calendar only: title "Call: <name>, <company>
   (HOLD, send invite)", no attendees, so no invitation email goes out automatically. The user
   sends the invite when they send the confirmation.
3. Set the pipeline row to `Booked`, with Next action = the call date.
4. The night before, `call-prep` writes the brief.

## On the call (remind the user in the brief)
Understand their setup first: volume, how it's handled today and what it costs them (the audit
questions from the matching service playbook). Price only once you know the setup, then follow
the `design-offer` package: paid audit, then pilot.
