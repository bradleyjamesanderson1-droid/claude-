---
name: free-site-offer
description: Run the free-website play for local businesses with no website — find them on Google Maps, build the site first, cold-call with "I couldn't find your site, want one free? Just leave me a testimonial", hand over one HTML file, host it, collect the testimonial, then offer paid services. Use when the user wants local-business prospects, a call list, the call script, a site handover or hosting help.
---

# The free-site play

**Free site, real testimonial.** You build first and call second, so the offer is concrete: "it's
already done, want it?"

| Step | What | Who |
|---|---|---|
| 1. Target | Local businesses on Google Maps with **no website** (the best targets) | `local-prospector` agent |
| 2. Build | `/website-builder` from the Maps link: colours, copy, one HTML file | `site-builder` agent (batches) |
| 3. Call | The cold call below | You |
| 4. Hand over | One HTML file, hosted, owner's changes made | You + `/website-builder` |
| 5. Testimonial | Collect it with permission, and use it in your own outreach and proof | You |
| 6. Next | Offer the paid service that fits (below) | You |

## 3. The cold call

> Hi, is that <owner/name>? I'm <name>. I was looking for <business> on Google and couldn't
> find your website. I've actually made you one. Want it? It's free. All I ask is a short
> testimonial if you like it.

- If they're interested: "What's the best WhatsApp or email? I'll send you a preview now." Send the
  screenshots or file, and confirm the details on the "confirm with owner" list in `facts.md`.
- "What's the catch?": "No catch. I'm building up my portfolio and a testimonial from you
  helps me more than money right now."
- "We don't need one": "No problem, thanks for your time." Log it, and don't call again.
- Keep it under 2 minutes. Call during business hours, never during their rush (lunch for
  restaurants, early morning for trades).
- South Africa: the Consumer Protection Act lets people block direct marketing (check the national
  opt-out registry if you call consumers). You'll know the rules; put yours in `agency/facts.md`
  under `compliance_rule`.

Log each call on the prospect's Notion row (Status: Interested / Not now / Lost / Do not contact).

## 4. Hand over
1. Make the owner's corrections with `/website-builder`: add their photos (inline, compressed),
   fix details, and remove anything they're unhappy with.
2. **Hosting** (free options, in order of ease):
   - **Netlify Drop** (app.netlify.com/drop): drag the folder in and get a live link in seconds.
   - **Cloudflare Pages** or **GitHub Pages**: also free, and better if you'll manage many sites.
   - A custom domain (~R100–R200/year for .co.za) is the owner's purchase, in their name. Help them connect it.
3. Also send them the file itself (renamed `index.html`): it's theirs and works offline.
4. Add them to Google Business Profile: website field → the live link.

## 5. The testimonial
Ask a week after it goes live: "Would you mind writing two lines about how it went? I'd like
to use it on my site and with other businesses." Get **written permission** to use their name,
business name and the quote. Save it to `agency/testimonials.md` with the date and consent note.
Never write it for them or edit its meaning.

## 6. The next offer (only once the site is live and they're happy)
A website creates enquiries, and enquiries create the problems the paid services fix:
- Missed calls or slow replies → **lead response** ("every enquiry answered in a minute").
- Lots of repeat questions → **support triage**.
- Want more customers → **outbound research**.
Use `/validate-problem` on what you learned during the handover before pitching.
