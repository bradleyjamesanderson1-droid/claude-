---
name: website-builder
description: Build a complete one-page website for a local business from a Google Maps link (or pasted business details) — picks the colours, writes the copy, and outputs a single self-contained HTML file that works offline and can be renamed index.html. Use when the user pastes a Maps link, says /website-builder, or wants a demo or free site for a local business.
---

# /website-builder

Paste a Maps link and get a whole website: **one HTML file**, everything inline, works with no
internet, rename it to `index.html` to host it.

## 1. Get the business facts
Input: a Google Maps link, a business name and town, or pasted details.

1. Try `WebFetch` on the Maps link. Maps pages often fail or come back empty, and some networks
   block google.com, so don't rely on this.
2. Otherwise `WebSearch` "<business name> <town>" for directory listings (Yellow Pages, Snupit,
   Facebook page, Hellopeter, SAFLII for firms), and fetch the useful ones.
3. If details are still missing, ask the user to paste them from the Maps card: **name,
   category, address, phone, hours, rating + review count, services mentioned in reviews, and
   the owner's name if known.**

Write the facts to `agency/sites/<slug>/facts.md`, with the source of each one.

**Never invent** services, prices, years in business, qualifications, awards, staff names or
testimonials. If something would help but isn't known, leave it out and put it on a
"confirm with owner" list at the bottom of `facts.md`. The rating may be shown as
"4.8★ from 120 Google reviews" if that's what the listing says. Don't copy review text onto
the site until the owner agrees.

## 2. Pick the colours
Pick from the category, then adjust to anything known about their branding (signage or
vehicle colours in their Facebook photos):

| Category | Primary | Accent | Feel |
|---|---|---|---|
| Plumber, electrician, trades | deep navy #1d3557 | safety orange #f4a261 | dependable |
| Salon, beauty, spa | plum #6d2e46 | blush #e8c1c5 | calm, premium |
| Restaurant, café, bakery | espresso #3e2723 | warm gold #e0a458 | appetite |
| Medical, dental, physio | teal #0f766e | mint #99f6e4 | clean, trust |
| Legal, accounting | charcoal #1f2937 | brass #b08d57 | serious |
| Auto, panel beater | graphite #111827 | red #dc2626 | strong |
| Garden, cleaning, pets | forest #2d6a4f | leaf #95d5b2 | fresh |

Check the text contrast is at least 4.5:1. Set the colours as CSS variables at the top of the file.

## 3. Write the copy
- **Hero:** what they do + where, in the customer's words ("Emergency plumbing in Centurion,
  7 days a week"), plus a tap-to-call button and a WhatsApp button (`https://wa.me/27…`).
- **Services:** 3–6 cards, taken only from the category and their listing or reviews.
- **Why us:** 3 short points, all true (rating, hours, area served, family-run *if known*).
- **Hours + location:** the hours table, the address, and a plain "Open in Google Maps" link.
  No embedded map, so it works offline.
- **Contact:** phone, WhatsApp and email if known.
- **Footer:** © year, business name, and a small "Website by <agency_name>" credit (from
  `agency/facts.md`).
- South African English. Short sentences. No buzzwords, and no mention of AI.

## 4. Build the file
Start from `template.html` in this folder, a working example for a fictional business. Keep its
structure and replace its content and colours.

- **One file.** All CSS inline in `<style>`, icons as inline SVG, no external fonts, scripts,
  images or CDNs. It must work with the internet off. Use a system font stack.
- Mobile-first (most customers are on phones), with large tap targets and sticky call buttons on mobile.
- Include SEO basics: `<title>`, meta description, and LocalBusiness JSON-LD with only known facts.
- No photos unless the owner supplies them. The design uses colour, type and SVG icons instead.
  Leave an HTML comment where their photos would go.

Save it to `agency/sites/<slug>/index.html`. Open it with Playwright at 390px and 1280px wide
and screenshot both into the same folder. Fix any layout problems before handing it over.

## 5. Hand it over
Tell the user: the file path, the screenshots, the "confirm with owner" list, and the next step
(`free-site-offer`).
