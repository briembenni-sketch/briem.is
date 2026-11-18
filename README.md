# briem.is

The website for **Briem** — a web studio in Reykjavík (founded by Benedikt
Briem) that designs and builds fast, distinctive websites for companies.

Live message: _“Vefsíður sem láta fólk taka fyrirtækið þitt alvarlega.”_

The `#work` section presents each project as a five-step walk-through in the
order a visitor moves through the site (front page → browse → detail → contact
→ phone). Every step has exactly one screenshot in `work/`:
`<name>.jpg` (front page, 1600×1000), `<name>-2.jpg` to `<name>-4.jpg`
(steps 2–4, 1200×750) and `<name>-m.jpg` (phone, 585×1266).

## Stack

A deliberately simple, dependency-free static site so it loads instantly and can
be hosted anywhere:

- `index.html` — single-page site (hero, work, testimonial, contact)
- `styles.css` — design system & all styling
- `main.js` — small, vanilla interactions (dot field, project viewer, reveal)
- `favicon.svg` / `og.svg` — brand mark & social share image

No build step. No framework. No tracking.

## Design system — “the caret”, signal edition

A flat, near-black surface with hairline rules and **no gradient backgrounds or
glows**. The life comes from motion and from the work itself.

| Token | Value |
| --- | --- |
| Display + body type | Archivo (variable width; headlines at 112–125%) |
| Mono / labels | JetBrains Mono |
| Background | `#0A0A0B` |
| Text | `#F3F3EF` |
| Accent | `#5B8CFF` (text) / `#2757CF` (fill) |
| Per-project colour | `--c` on each project: blue, gold, green, red |

What moves:

- **Dot field** (hero canvas) — ripples travel across a grid of dots, the
  pointer lights up the dots around it, a click sends a new ripple.
- **Project viewer** — cycles through the four sites; the progress fill in each
  tab is the timer (`animationend` advances), hover pauses it.
- **Project consoles** — in each case study a step list drives a screen: the
  active step's fill is the timer, it only runs while the project is in view,
  and it stops for good once the visitor picks a step themselves.
- **Headline decode**, a **domain marquee** and count-up stats.
- The blinking **caret** still closes the headline and the contact title.

The site is fully visible without JavaScript and every animation respects
`prefers-reduced-motion`.

## Running locally

It’s static — just open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying

Point any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages) at the
repository root. No configuration required.

## Editing

- **Contact email** — search for `briem@projectbriem.is` to swap it.
- **Work** — case studies live in the `#work` section of `index.html`. Keep the
  rule: one step, one sentence, one screenshot that shows exactly that. Add a
  new site to the hero viewer (slide + tab) and the marquee as well.
- **Copy is written in Icelandic (Íslenska).** The page declares `lang="is"`.

---

© Benedikt Briem · Reykjavík, Ísland
