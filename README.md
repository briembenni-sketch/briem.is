# briem.is

The website for **Briem** — a web studio in Reykjavík (founded by Benedikt
Briem) that designs and builds fast, distinctive websites for companies.

Live message: _“Vefsíður sem láta fólk taka fyrirtækið þitt alvarlega.”_

The `#work` section showcases live projects with real screenshots stored in
`work/` (e.g. `work/chessafterdark.jpg`, `work/betkastid.jpg`).

## Stack

A deliberately simple, dependency-free static site so it loads instantly and can
be hosted anywhere:

- `index.html` — single-page site (hero, work, services, process, about, contact)
- `styles.css` — design system & all styling
- `main.js` — small, vanilla interactions (menu, scroll reveal, sticky header)
- `favicon.svg` / `og.svg` — brand mark & social share image

No build step. No framework. No tracking.

## Design system — “the caret”, aurora edition

A dark, modern fintech/crypto-landing aesthetic — aurora gradient glows,
glassmorphism, and a glassy “performance dashboard” hero mockup — rendered in a
**blue → cyan** palette (no purple).

| Token | Value |
| --- | --- |
| Display type | Bricolage Grotesque |
| Body type | Hanken Grotesk |
| Mono / labels | JetBrains Mono |
| Background | `#070A14` |
| Text | `#EAF0FB` |
| Accent (blue) | `#5B8CFF` / `#2F6BFF` |
| Accent (cyan) | `#38BDF8` |
| Brand gradient | `linear-gradient(135deg, #2F6BFF, #38BDF8)` |

The signature element is the blinking **caret** `▌` that trails the `briem`
wordmark — a code/text cursor that marks every build as hand-made. The landing
layers on:

- an ambient **aurora** glow and a faint hero grid,
- a gradient-bordered, glassmorphic **hero dashboard** (animated Lighthouse
  chart + floating metric chips),
- a market-style **ticker** and an animated **stats strip** (count-up on scroll),
- glass **feature cards** with gradient icon tiles and a gradient **CTA band**.

All colour pairings meet WCAG AA contrast, the site is fully visible without
JavaScript, and every animation respects `prefers-reduced-motion`.

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

- **Contact email** — search for `briembenni@gmail.com` to swap it (e.g. for
  `hello@briem.is`).
- **Work** — case studies live in the `#work` section of `index.html`.
- **Copy is written in Icelandic (Íslenska).** The page declares `lang="is"`.

---

© Benedikt Briem · Reykjavík, Ísland
