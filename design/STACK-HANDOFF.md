# Handoff: `/stack` — My AI-powered operating stack

Source of truth: the portfolio Design canvas "Aswin — Portfolio Website Design & Prototype"
(https://claude.ai/artifact/3FkyPhRp8gfVih7mxwYUw2), bottom row "/stack — operating stack page, expanded layer and homepage strip". Build exactly what is drawn there; this file spells it out.
The /stack boards were first drawn on a separate canvas (https://claude.ai/artifact/7i3KBapRKAepAuYaV3jUaG). That canvas is now only an earlier copy: if the two differ, the portfolio canvas wins.

Boards and files on the portfolio canvas:

| Board | File | What it is |
|---|---|---|
| /stack — desktop (1440) | `Stack.dc.html` | The /stack page. It was `Main.dc.html` on the old canvas, renamed so it doesn't clash with the home page. |
| /stack — mobile (390) | `StackMobile.dc.html` | The /stack page on phones |
| Expanded layer — desktop + mobile | `StackExpanded.dc.html` | One layer open, both layouts |
| Homepage strip — desktop + mobile | `HomeStrip.dc.html` | The strip spec. The strip is also placed on the home page boards (`Main.dc.html` and `Mobile.dc.html`). |
| Component · Stack diagram | `StackDiagram.dc.html` | The diagram used by all of the above |

Nav, Footer and Ask my work are the site's existing components (`Nav.dc.html`, `Footer.dc.html`, `Ask.dc.html`). Reuse them; don't rebuild them.

Placeholders are written as `[link]` / `[repo]`. Don't ship them: either fill in the real URL or hide that link.

---

## 1. Design tokens (same as the rest of the site, light theme)

| Token | Value | Use |
|---|---|---|
| `bg` | `#F6F3EC` | page background, inset proof card, tool chips |
| `paper` | `#FFFDF8` | cards, layer stack background |
| `ink` | `#1B1A17` | text, Judgment band background, primary button |
| `muted` | `#5C574E` | secondary text, mono labels |
| `rule` | `#E2DCD0` | borders, dividers |
| `accent` | `#1F4C86` | links, cues, homepage strip CTA |
| `amberText` | `#8A5510` | "My call" line (the human decision, same as "person decides" elsewhere on the site) |
| Judgment band label | `#CFC8BA` on `#1B1A17` | mono eyebrow |
| Judgment band body | `#E4DED2` on `#1B1A17` | serif body |
| Judgment pills border | `#5A554C` | |
| Thumbnail band border | `#CFC7B8` | homepage strip only |
| Focus ring | `2px solid #4F7FC0`, offset 2px (strip: offset −2px) | all interactive elements |

Fonts: Newsreader (serif display/body: 400, 500, italic 400), IBM Plex Sans (400/500/600), IBM Plex Mono (400/500). These are the same Google Fonts link the site already uses.
Radii: 16px (Judgment band, layer stack), 12px (rule cards, proof card), 10px (buttons), 6px (tool chips, toggle icon), 999px (pills/tags).
Content column: `max-width: 1040px`, side padding 24px (desktop) / 20px (mobile). Section separators: `border-top: 1px solid rule`.
No gradients, glows or shadows on this page.
Respect `prefers-reduced-motion`. No animation is designed for this page. If you add an expand transition, keep it ≤150ms and turn it off under reduced motion.

---

## 2. Components

### 2.1 `Nav` (existing; one change)
- Add a **Stack** item between "Case studies" and "Build log": `{ id: 'stack', label: 'Stack', href: '/stack' }`.
- Add `'stack'` to the `current` enum. On /stack it's `current="stack"` (ink text and a 2px ink underline, with `aria-current="page"`).
- Mobile menu gets the same item in the same position.
- Both are already drawn: `Nav.dc.html` and the home page's mobile menu (`Mobile.dc.html`) list Case studies · Stack · Build log · CV · Contact.
- X-ray: /stack has no AI features, so the X-ray toggle stays in the nav unchanged and turning it on has no effect here. The intro banner isn't shown on /stack.

### 2.2 `StackHero` (page-local)
- Eyebrow (mono 12px, letter-spacing .08em, muted): `/STACK · HOW I WORK WITH AI`
- `h1` (serif 400, `clamp(40px, 6vw, 64px)`, line-height 1.04, letter-spacing −0.015em, max-width 820px): **My AI-powered operating stack**
- Subline (serif 22px / 1.45, muted, max-width 720px): **Products have a tech stack. Professionals now need an operating stack. Tools change, principles don't.**
- Meta (mono 13px, muted, 8px above): `1 rule on top · 4 layers · each with proof. Open a layer to see the tools, how I use them and the work it produced.`
  Mobile copy: `1 rule on top · 4 layers · each with proof. Tap a layer to open it.`
- Padding: 72px top / 40px bottom (desktop); 36 / 28 (mobile, h1 38px, subline 19px).

### 2.3 `StackDiagram` (the centrepiece; one component, two layouts)
Props: `compact` (bool, mobile layout), `open` (initial open layer: none|1–4), `idPrefix` (keeps ids unique if it's rendered twice).

Structure, top to bottom:
1. **Judgment band** (`<section aria-labelledby>`), ink background, paper text, radius 16. Padding 32/36 (desktop) and 22/20 (compact).
   - Eyebrow mono 12px `THE TOP LAYER · NEVER OUTSOURCED`
   - `h2` serif 34px (compact 26px): **Judgment — the layer I never outsource.**
   - Body serif 20px (compact 17px): **AI researches, synthesizes, challenges and executes. I stay accountable for what matters, what's true and what ships.**
   - A `<ul aria-label="What I stay accountable for">` holds 3 pills (mono 13px): `what matters` · `what's true` · `what ships`. On desktop they sit at the bottom right. They wrap below the text when the band is narrower than about 860px.
2. **Rail connector** (`aria-hidden`), 40px tall: a 1px vertical line `#B9B1A3` lined up with the centres of the layer numbers (51px from the left on desktop, 34px compact), plus mono 12px muted text `governs every layer below`.
3. **Layer stack**: `<ol aria-label="Operating stack layers">` with a paper background, 1px rule border, radius 16, `overflow:hidden`. Each `<li>` after the first gets a 1px rule divider on top.

**Layer header** (an accordion trigger): `<h3><button id aria-expanded aria-controls>`.
- Grid columns: `40px | 1fr | auto` (compact: `32px | 1fr | auto`), gap 20px. Padding 22px 28px (compact 16px). Min height 64px.
- Number disc: 40px (compact 32), mono 12px.
  Closed: 1px rule border, paper fill, muted text. Open: ink fill and ink border, paper text.
- Name: serif 26px (compact 21px).
- Summary: sans 15px (compact 14px), muted, line-height 1.45.
- Cue, on the right: mono 13px accent. On desktop it's the text `Open` / `Close` plus a 24px square icon `+` / `−`. The icon's border is rule when closed and accent when open. In compact layout only the icon shows, but the button keeps its accessible name from the layer name and summary.

**Layer panel** (shown only when open): `<div id role="region" aria-labelledby={button id}>`.
- Desktop: a 3-column grid `0.8fr | 1.2fr | 1fr`, gap 20/32. Padding 4 28 28, with 88px on the left so it lines up under the name.
- Compact: one column, padding 4 16 20 16.
- Column 1 **TOOLS**: a mono 11px label, then chips in a `<ul>` (mono 12px, bg fill, 1px rule border, radius 6).
- Column 2 **HOW I USE IT**: a label, then 15px/1.55 body. Under it, a **MY CALL ·** line (amberText, 14px, with a mono 11px label).
- Column 3 **Proof card**: the whole card is one `<a>`, with bg fill, 1px rule border, radius 12, padding 16. Inside: mono label `PROOF · {kind}`, a 16px/600 title, a 14px muted body, and a mono 13px accent CTA.

**Behaviour**
- Layers open and close independently, so more than one can be open at a time (not a strict accordion). Everything starts closed.
- Keyboard: Tab reaches each header button. Enter or Space toggles it. Focus stays on the button. `aria-expanded` reflects the state.
- Deep link: `/stack#layer-3` should open layer 3 and scroll to it. Optional, but cheap to add.
- Rendered as a plain list, with no horizontal scrolling at any width down to 320px.

### 2.4 `JudgmentRules` (page-local)
- Eyebrow `JUDGMENT RULES`. `h2` serif 36px (mobile 28px): **Four rules the whole stack runs on**
- An `<ol>` grid: desktop `repeat(auto-fit, minmax(220px, 1fr))`, which gives 4 across at 1040 and 2×2 when narrow; mobile is a fixed 2×2 with a 10px gap. The cards are paper, 1px rule border, radius 12, padding 20 (mobile 14).
- Each card: mono `R1`–`R4`, then an `h3` serif 23px (mobile 19px), then a 15px muted body (mobile 13px).

### 2.5 `StackClosing` (page-local)
- `h2` serif 44px (mobile 32px): **What's in your stack?**
- Body serif 20px (mobile 18px), muted: **I wrote about building mine on LinkedIn. Tell me what's in yours.**
- Primary link button (ink background, paper text, min-height 48, radius 10): `Read the LinkedIn post` → `[link]`
- One button only (no Ask my work button in this section; Ask stays reachable from the nav).
- Desktop: text and button sit side by side and wrap. Mobile: they stack, with a full-width button.

### 2.6 `Footer`, `Ask` (existing, unchanged)

### 2.7 `HomeStackStrip` (homepage)
- Placement: directly under the fit-check hero, above "ACROSS ALL MY WORK", on desktop and mobile. This is drawn on the home page boards (`Main.dc.html`, `Mobile.dc.html`).
- The full-width `<section aria-label="Operating stack">` has a 1px rule border on top. On the home page it has no bottom border, because the next section ("ACROSS ALL MY WORK") already has a top border; this avoids a double line. The whole strip is one `<a href="/stack">`.
- Inner row (max 1040): thumbnail, then the statement, then the CTA.
- Statement: serif 26px (mobile 19px): **I run on an AI-powered operating stack.**
- CTA: **See how I work, layer by layer →**
  - Desktop: on the right, styled as an outline button (1px accent border, accent text, sans 15px/600, radius 10, min-height 44, padding 0 16). It's not a separate link; the whole strip is the link.
  - Mobile: a second line under the statement, mono 13px accent.
- Thumbnail (`aria-hidden`), drawn in CSS with no image:
  - Desktop: a 112px-wide paper tile, 1px rule border, radius 8, padding 8. Inside, from the top: one 14px ink band, a 4px gap, then four 9px bands (bg fill, 1px `#CFC7B8` border, radius 2), with 3px gaps.
  - Mobile: a 64px tile with radius 6 and padding 6. One 9px band, a 2px gap, four 6px bands.
- Hover: underline the CTA (1px, 4px offset). Focus: the blue ring inset (−2px). Mobile tap target is at least 76px tall.

---

## 3. Layer content

| # | Name | Summary (collapsed) | Tools | How I use it | My call | Proof kind · title · body · CTA → href |
|---|---|---|---|---|---|---|
| 01 | Thinking & challenging | Claude with my PM Skills library; ChatGPT and Gemini to challenge big decisions. | Claude · PM Skills library · ChatGPT · Gemini | I frame the problem myself, then use Claude with my PM Skills to research and draft options. For big decisions I ask a second model to argue against my plan. | Which problem is worth solving, and which option I back. | BEFORE / AFTER · A decision, before and after the challenge round · My first draft, the objections a second model raised, and what I changed. · `See the example →` → **[link: before/after page]** |
| 02 | Context | A product context repo (strategy, personas, metrics, decisions) and OpenSpec for specs. | Context repo · OpenSpec · Markdown · Git | Strategy, personas, metrics and past decisions live in one repo every AI session starts from. Specs are written in OpenSpec, so a build starts from an agreed spec, not a chat. | What goes into the context, and what is out of date. | MASTER RESUME + PRD · One source of truth, and a site built from a PRD · My master resume feeds every tailored CV and the fit check. This site was built from a written PRD. · `Read the PRD →` → **[link: PRD page]** |
| 03 | Building & communicating | Claude Code prototypes and data checks, to learn, not to ship; PRDs and decision docs. | Claude Code · PRDs · Decision docs | I build throwaway prototypes and quick data checks to test an idea before asking engineering for time. What I learn goes into a PRD or a decision doc. | What the prototype proved, and what still needs engineering. | LIVE ON THIS SITE · The JD fit check, and how I built it · Paste a job description and get a cited verdict. "How I built this" shows the spec, the trade-offs and the evals. · `Try the fit check →` → `/#fit-h` (add a second link to **[link: How I built this]** once that page exists) |
| 04 | Automation | Scheduled agents for feedback and competitor digests, metrics summaries and meeting briefs. | Scheduled agents · MCP connectors · Claude | Agents run on a schedule and leave a digest for me to read. Anything that sends, applies or publishes waits for my approval. | Every action that leaves my desk. | OPEN SOURCE · Job-search agent on GitHub · Searches LinkedIn, tailors my resume to each JD, and applies only after I approve. · `github.com/aswin-a/[repo] →` → **https://github.com/aswin-a/[repo]** |

Keep this as one data array (e.g. `content/stack.ts`), so tools and proof links can change without touching layout.
External links (GitHub, LinkedIn) open in the same tab, matching the rest of the site's footer links.

---

## 4. Responsive behaviour

| Breakpoint | Layout |
|---|---|
| ≥ 1024px | Hero, diagram and sections sit in the 1040 column. Layer panels use 3 columns. Rules are 4 across. Closing text and buttons are side by side. |
| 640–1023px | The diagram stays full (non-compact), and panels fall back to 1 column when narrower than 760px. Rules go 2×2. Judgment pills wrap below the text. |
| < 640px | `compact` diagram: smaller sizes as listed above. The cue shows only the +/− icon. Panels are one column with 16px padding. Rules are 2×2. Closing buttons are full width. The site's mobile header and menu are used instead of Nav. |
| Any width | No horizontal scroll. Every interactive target is at least 44px. |

Page metadata: `<title>My AI-powered operating stack — Aswin</title>`. Meta description: the subline. The OG image can reuse the CSS thumbnail rendered larger (optional).

---

## 5. States checklist

- Layer header: rest, hover (pointer only; cue underline is enough), focus-visible (blue ring), open (ink disc, `−` icon with accent border, "Close").
- Layer panel: hidden (not rendered, or `hidden` attribute), shown.
- Proof card: a link that is real, or a placeholder. Don't ship `[link]`: hide the CTA line until the URL is real.
- Closing: LinkedIn link is a placeholder until the post is live.
- Home strip: rest, hover, focus.

## 6. Accessibility acceptance

- Heading order: `h1` (page) → `h2` Judgment → `h3` each layer → `h2` Rules → `h3` each rule → `h2` Closing.
- Every accordion is a `<button aria-expanded aria-controls>` inside an `h3`. Each panel is a `role="region"` labelled by its button.
- Contrast checked: muted `#5C574E` on paper/bg ≥ 6.5:1. Accent `#1F4C86` on bg ≥ 8:1. `#CFC8BA` and `#E4DED2` on ink ≥ 9:1. amberText `#8A5510` on paper ≥ 5.5:1.
- Decorative elements (rail, thumbnail) are `aria-hidden`.
