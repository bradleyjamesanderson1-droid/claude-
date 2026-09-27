---
name: sort-replies
description: Sort every reply to the agency's outreach into a bucket and draft the right answer as a threaded Gmail draft — wants to talk or asks the price means book the call, no means thank them and stop, plus not-now, referral, question, out-of-office and unsubscribe. Use in the nightly run or when the user asks to go through outreach replies.
---

# Sort every reply

Every reply has a home. Find replies with Gmail searches `from:<email>` for pipeline rows in
`Sent`, `Follow-up sent`, `Interested` or `Asked price`, and read each thread in full with
`get_thread` (search previews miss the newest messages).

| Bucket | Signals | Action | Pipeline |
|---|---|---|---|
| **Wants to talk** | "sure", "tell me more", "call me", "how does it work" | Draft a booking reply (`book-the-call`) | Interested |
| **Asks the price** | "what does it cost", "pricing?" | Draft a booking reply. **Never give the price.** | Asked price |
| **Says no** | "not interested", "no thanks" | Draft a short thank-you (below). Never follow up again. | Lost + Do not contact |
| **Unsubscribe / stop** | "remove me", "stop", "unsubscribe", annoyed tone | **No reply.** Suppress immediately. | Do not contact |
| **Not now** | "next quarter", "busy until…" | Draft a one-line thanks that confirms when you'll check back | Not now, Next action = their date |
| **Referral** | "speak to X" | Draft a thanks; create a new row for X with "referred by" noted | Referred (+ new row) |
| **Question** | a specific question other than price | Draft a one- or two-sentence answer using only `facts.md`, then the booking line | Interested |
| **Out of office** | auto-reply | No draft. Next action = their return date + 1 | unchanged |
| **Unclear / sensitive** | a complaint, a legal threat, anything odd | No draft. Flag it in the digest for the user. | unchanged |

## Reply drafts
- Create them with `create_draft` and `replyToMessageId` set to the latest message, so they sit in
  the thread. Never send.
- Keep them as short as the outreach: two or three lines, warm, the sign-off from `facts.md`.
- **Says no:** "Thanks for letting me know, <name>, I won't contact you again. All the best with
  <something specific and true>." Nothing else: no "if things change", no pitch.
- Don't mention AI or software unless they asked directly. If they did, answer in one plain
  sentence and move to booking.

Report the counts per bucket for the digest, and list every "unclear" thread with its link.
