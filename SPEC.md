# Portfolio Website — v1 Build Spec

Owner: Aswin (Senior Product Manager · platform, APIs, integrations; builds AI agents)
Scope: **v1 only.** No vector database, no embeddings.

> **The design in `/design` is the final, approved source of truth for what the site looks like, says and does.** This spec translates it into a build: routes, backend, data and limits. Where this spec is silent, the design decides. Where they seem to conflict, stop and ask Aswin (see CLAUDE.md).

---

## 1. The design files

`/design` holds the 11 finalised artboards exported from Claude Design ("Aswin — Portfolio Website Design & Prototype"). Each `.dc.html` is a self-contained prototype: markup with inline styles, `{{bindings}}`, `<sc-if>` / `<sc-for>` / `<dc-import>` and a `<script type="text/x-dc">` block holding state, sample data and interaction logic.

| Artboard | What it is | Becomes |
| --- | --- | --- |
| `Main.dc.html` | Home page, 1440 wide | `/` |
| `Hero.dc.html` | Fit-check hero component (all logic + copy) | `components/fit-check/*` |
| `HeroStates.dc.html` | The hero's states side by side: empty, running, result, badfit, error, limited, plus "X-ray on: Break my AI" (the empty fit check with the X-ray red-team panel below it) | Acceptance reference for the hero |
| `Nav.dc.html` | Header with Case studies / Build log / CV / Contact (design update 7), X-ray toggle, Ask my work ⌘K | `components/nav.tsx` |
| `Footer.dc.html` | Shared "Talk to Aswin" contact section + site footer bar, on every page (design update 6); WhatsApp and call buttons and the contact form's states (design update 7; props `initial` and `still`) | `components/footer.tsx` |
| `FooterStates.dc.html` | The contact form's 6 states side by side: Ready, Invalid, Sending, Sent, Error, Rate-limited (design update 7) | Acceptance reference for the contact form |
| `Ask.dc.html` | "Ask my work" command bar (desktop modal; `sheet` prop = mobile bottom sheet; optional `topic` and `autoAsk`, design update 6) | `components/ask/*` |
| `Work.dc.html` | CloudEagle case study, the PRD template for every product's case study | `/work/[slug]` |
| `BuildLog.dc.html` | Build log index with category filters | `/log` |
| `About.dc.html` | CV (design update 6): header with Download PDF / Copy as plain text, 4 stat cards, Ask box, experience timeline (roles, side projects, education; Zelthy's expandable groups), skills, certificates | `/about` |
| `Mobile.dc.html` | Home at 390 px (recruiter arriving from LinkedIn) | Responsive behaviour of `/` |
| `MobileAsk.dc.html` | Ask my work as a phone bottom sheet | Responsive behaviour of Ask |
| `canvas.json` | Artboard titles, sizes and order | Reference only |

How to read them:
- **Copy is final.** Every heading, label, button, helper line, empty state and error message is used word for word.
- **Visual values are final.** Colours, fonts, sizes, weights, spacing, radii, borders and breakpoints come from the inline styles. Don't round them or swap in framework defaults.
- **Interactions are final.** Every state, toggle, filter, hover/focus style and transition in the `<script>` blocks is required behaviour.
- **Prototype mocks become real.** The scripts fake the backend: `setInterval` step animation, regex classifiers (`heroClassify`, `askRoute`, `workClassify`), and hard-coded results (`HERO_FIT`, `HERO_BAD`, `ASK_ANSWERS`). In the build these come from the real AI pipeline (§6–8). The sample data shows the exact **shape and tone** the real output must have.
- **`[bracketed text]` is a placeholder for Aswin's real content** (e.g. `[N] years`, `[measured]`, `[link]`, `[date]`). It must come from `/content` files, never be invented, and never ship to production as a literal bracket (see §12).
- `support.js`, `DCLogic`, `x-dc` etc. are the prototype runtime. Don't import them; rebuild in React.

## 2. Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React, TypeScript strict, Server Components by default |
| Package manager | pnpm |
| Styling | Tailwind CSS with the design tokens in §3 as the theme. No component library unless it can match the design exactly |
| Fonts | `next/font/google`: Newsreader (400, 500, 400 italic; opsz 6–72), IBM Plex Sans (400, 500, 600), IBM Plex Mono (400, 500) |
| Content | MDX + typed TS data files in `/content` |
| LLM | Anthropic Claude via Vercel AI SDK (`ai` + `@ai-sdk/anthropic`); model IDs from env |
| Validation | Zod |
| Rate limit + budget | Upstash Redis + `@upstash/ratelimit` |
| Bot protection | Cloudflare Turnstile (invisible) |
| Logging | Supabase Postgres (run metrics only, no visitor text) |
| Email (contact form) | Resend |
| Analytics | PostHog (cookieless) |
| Tests | Vitest, Playwright, Promptfoo |
| Hosting | Vercel + GitHub Actions |

Check the current docs for each library before using its API.

## 3. Design tokens (from the artboards, exact)

**Light is the only page theme** (design update 3, 2026-11-19). The dark column is the **X-ray panel tokens**: used only inside X-ray panels and on the active X-ray toggle in Nav. Turning X-ray on never re-themes the page.

| Token | Light (page) | X-ray panel |
| --- | --- | --- |
| `bg` | `#F6F3EC` | `#101214` |
| `panel` | `#EFEAE0` | `#14171A` |
| `paper` | `#FFFDF8` | `#171A1D` |
| `ink` | `#1B1A17` | `#E9E6DF` |
| `muted` | `#5C574E` | `#A3A9B0` |
| `rule` | `#E2DCD0` | `#2B3036` |
| `accent` | `#1F4C86` | `#8DBBF2` |
| `accentTint` | `#E8EEF6` | `#17283D` |
| `amberText` | `#8A5510` | `#EDB65E` |
| `amberBorder` | `#C08A2E` | `#B8862F` |
| `amberBg` | `#FBF2E2` | `#241C10` |
| `btnBg` | `#1B1A17` | `#E9E6DF` |
| `btnInk` | `#FFFDF8` | `#101214` |

Home uses `amberText`, `amberBorder` and `amberBg` too (design update 4: the human step in "Products I've built"), with the same values.

Also: focus ring `2px solid #4F7FC0`, offset 2px; Ask scrim `rgba(27,26,23,0.38)` light / `rgba(0,0,0,0.6)` X-ray; Ask shadow `0 24px 60px rgba(20,18,15,0.22)`.
Font roles: `serif` = Newsreader (headlines, ledes), `sans` = IBM Plex Sans (body, buttons), `mono` = IBM Plex Mono (labels, metadata, traces).
Implement both sets as CSS variables (the panel set under its own names), so every component reads tokens and never hard-codes hex. There is no `data-theme="xray"` whole-page switch. Provide an `XrayPanel` component (X-ray panel tokens, `border: 1px solid` panel `rule`, the X-RAY pill pinned top-right: `top 10px; right 12px; padding 2px 8px; radius 999px; 1px solid #8DBBF2`, IBM Plex Mono 10px, `letter-spacing 0.1em`) and an `xray` flag in React context that X-ray-only content reads.

Global rules seen in every artboard: touch targets ≥ 44 px, `prefers-reduced-motion` disables transitions, smooth scroll on the case study, `a:hover{opacity:0.82}`.

## 4. Routes

| Route | Source | Notes |
| --- | --- | --- |
| `/` | `Main.dc.html` + `Hero.dc.html`, mobile per `Mobile.dc.html` | Sections in order (design update 4): Nav, X-ray intro banner, Hero (fit check), "How I build agentic products, with proof" (12 cards), "Products I've built" (4 products), From the build log, the shared Footer (Contact + footer bar, §5), Ask overlay. Before / after AI is no longer on home (it stays inside the case study) |
| `/work/[slug]` | `Work.dc.html` | The nav label is "Case studies"; the route stays `/work`. The only case studies are the 4 products in `content/products.ts`, numbered and ordered as on home, all from the same PRD template: `job-search-agent` (01), `fit-check` (02), `integration-builder` (03, the CloudEagle.ai take-home; breadcrumb "03 · CLOUDEAGLE.AI"), `instagram-agent` (04). The "Next" card follows that order. Products 01 and 04 show a recorded run (video or trace replay), not a live agent. Platform & API work is removed (Aswin, 2026-11-20) |
| `/work` | Not designed | **Gap:** default to the "Products I've built" section of `Main.dc.html` (the 4 product cards) as a standalone page with Nav and footer. Flag it to Aswin |
| `/log` | `BuildLog.dc.html` | Filters: All, Build notes, Teardowns, Essays, TIL, with counts |
| `/log/[slug]` | Not designed | **Gap:** simple article page in the build-log type styles (serif title, mono meta line, 880 px column). Flag it to Aswin |
| `/about` | `About.dc.html` | The CV page (design update 6). The nav label is "CV"; the route stays `/about`. Rendered from `content/cv.ts` |
| `/about.md` | `content/cv.ts` | Markdown twin of the CV for GEO, generated from the same content as the page and "Copy as plain text" (design update 6) |
| `/api/run` | §6–8 | The single AI endpoint ("one endpoint, one knowledge base, two prompts") |
| `/api/contact` | §9 | |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/llms-full.txt`, `/rss.xml` | §11 | |

## 5. Global behaviour

**X-ray mode** (`Nav.dc.html`, `Main.dc.html`)
- The toggle in Nav reveals the X-ray panels on every page; it does not re-theme the page. The toggle itself shows the state (on: dark button, accent track). The Ask scrim still darkens in X-ray.
- X-ray-only content: the "This run" and "Build details" panels, the Break my AI panel (hero), "How I built this" (hero), drill traces, the Ask answer trace, the case-study logged trace, the eval table, and the guard chips.
- It persists across page navigation and reloads within the session (sessionStorage), and can be set by `?xray=1`.
- Intro banner on home: "New here? Try X-ray." with "Turn on X-ray" and "Got it". Shown until dismissed or X-ray is turned on; the Nav shows a "NEW" pill while the banner is showing. Remember dismissal in localStorage.
- "How I build agentic products, with proof" cards marked "live here" turn X-ray on and scroll to their anchor: the hero (`#top`) or the Break my AI panel (`#break-my-ai`). That panel only exists while X-ray is on, so X-ray turns on first, then the page scrolls. The "planned" card has no link.
- **Shared Footer on every page** (`Footer.dc.html`, design update 6): one component, rendered at the end of every page. It holds the "Talk to Aswin." contact section (`section#contact`, padding `72px 24px 88px`, or `48px 20px 56px` below 640px; links LinkedIn, GitHub, CV; the contact form, §9) and then the footer bar: "This site is an AI product. Turn on X-ray to see how it works." and "Updated {date} · © 2026 Aswin · {domain}", the same on phones (the one-line phone footer is gone). The `#contact` anchor works from every page. Above the LinkedIn / GitHub / CV links sit the direct contact options (design update 7): "WhatsApp me" (opens `https://wa.me/{digits}?text=…` in a new tab; the text is "Hi Aswin, I found your portfolio. I’m hiring for a {role} role." when the form has a role, else "Hi Aswin, I found your portfolio."), "Call me" (`tel:+{digits}`) and the line "{phone} · calls {hours} · WhatsApp anytime", plus " · role added to the message" when the role was pre-filled from the fit check. Phone, hours and response time come from config (§13), never code; the phone number is shown only on the page, never in JSON-LD, `llms*.txt` or the markdown twins unless Aswin says yes. `{date}` is filled at build time (the build's date, `BUILD_DATE`, formatted like "20 Nov 2026"), never hard-coded. There is no per-page contact or footer code.

**Hidden case studies** (Aswin, 2026-11-24; not in the design)
- A case study not listed in `content/case-studies/visibility.ts` is hidden. Its page at `/work/{slug}` stays reachable by URL, with `noindex`, but nothing on the site links to it.
- Each link that would go to it shows its label (without the arrow) in muted text, with a dashed "COMING SOON" pill like the proof grid's "planned" pill. Product cards whose two buttons both go to the same hidden study show one line. Phone cards for hidden studies aren't links.
- Source chips (fit check, Ask) that cite a hidden study show their label as plain muted text. Ask's "Jump to" leaves it out. It's left out of the sitemap, `llms.txt` and `llms-full.txt`.
- All four are hidden at launch. To publish one, add its slug to the list.
- **Coming-soon posts** (same day): a build-log post with `comingSoon: true` is listed on `/log` with its tag, title (muted, not a link), summary and the pill, and has no page. The sitemap, RSS and `llms.txt` leave it out. Proof cards that link to it show the pill. These are "Shipping ML OCR with a person in the loop" (human in loop) and "Why I advised against sending patient data to LLMs" (data privacy).
- The planned "mcp server" card shows the same COMING SOON pill in place of its "Coming soon" CTA.

**Ask my work** (`Ask.dc.html`, `MobileAsk.dc.html`)
- Opens from the Nav button, the hero's "Ask my work" button, gap cards, and the keyboard shortcut ⌘K / Ctrl+K. Esc closes it. Focus is trapped while open and returns to the trigger on close.
- Desktop: centred modal, max-width 680, top padding 10vh. ≤ 640 px: bottom sheet (`sheet` mode), radius 18 18 0 0.
- Suggested questions change by page (`ASK_BY_PAGE`: home, work, log, about). The question texts in `ASK_ANSWERS` are the exact suggested-question copy.
- "Jump to" links as designed. **No "Break my AI" chips in Ask** (Aswin, 2026-11-23, overriding `Ask.dc.html`): Break my AI lives on the hero only. The attack questions still get their guarded answers when typed.
- **Topic mode (design update 6):** Ask accepts an optional `topic` (`{label, questions}`) and an initial question (`autoAsk`). With a topic, a box "ASKING ABOUT · {label}" lists the topic's questions as tappable rows. An initial question is asked as soon as Ask opens. The CV page opens Ask this way: "Ask about this role →" (the item's questions, label "{title} · {company}"), the Ask box's own question and its 3 chips (topic "My experience"). Topic questions are **suggested prompts only**: they go to the live endpoint like any other question; the prototype's canned `a` answers are never shown.
- **Session memory:** after a fit check, its context (role, match count, gaps) is carried into Ask and shown in the "CONTINUING FROM YOUR FIT CHECK · SESSION MEMORY" box with "Forget this". It lives in sessionStorage only and is sent with Ask requests. Nothing is stored server-side.

**Contact in the nav (design update 7):** a 4th link "Contact" after CV, `href="#contact"`. It smooth-scrolls to `#contact` on the current page (every page has the Footer); if the element isn't there it falls back to the normal link. `prefers-reduced-motion` makes the scroll a jump.

**Contact pre-fill:** "Talk to Aswin about this role" in the hero scrolls to `#contact` (the shared Footer) and pre-fills the Role field, showing "pre-filled from your fit check". Only the fit check sets the role; other pages leave it empty.

**CV page** (`About.dc.html`, design update 6): "Copy as plain text" copies the CV as plain text (`cvPlainText()` in the design), built from `content/cv.ts`, and shows "Copied ✓" for 2 s. "Download PDF" will serve a static PDF built from the same content at build time; until then it is a placeholder `#` link. Zelthy's 7 area cards each open independently (`aria-expanded`); an open card spans the full row with an accent border and "Hide N points ↑". Below 640px the dates column is hidden and the dates show inside each card.

## 6. Knowledge base (no vector DB)

**The CV is the one source** (design update 6). `content/cv.ts` holds the CV word for word from `About.dc.html`: `stats`, `items` (`{ id, lane: 'work'|'project'|'edu', dates, title, org, ladder?, scope, highlights[], groups?: {name, summary, items[]}[], qa?: {q}[], link?, href?, link2?, href2? }`), `skills` and the general Ask topic. The CV page, "Copy as plain text", `/about.md` **and the knowledge base** are all generated from it, so the CV page and the AI can never disagree. A unit test checks that every role, project and fact entry traces back to a CV line. The not-done list is the one hand-written part (it lists what is *not* on the CV).

Everything the AI may say comes from typed content in `/content/kb/`, generated from `content/cv.ts`:

```
/content/kb/
  roles.ts          # { id, title, company, years, summary, href }[]   ← from cv.items (lane work, edu)
  projects.ts       # { id, title, status, summary, evidence[], href }[] ← side projects, Zelthy's groups
  not-done.ts       # { id, topic, closest?, note }[]  ← things Aswin has NOT done
  facts.ts          # canonical bio facts used in answers ← CV header, stats, skills
  fallback.ts       # the 3 precomputed role-type matches (HERO_FALLBACK shape)
```

- Each entry has a stable `id`, a human `label` for source chips (e.g. "Case study · CloudEagle concept", "CV · Senior Product Manager · Zelthy", "CV · My experience"; CV-based entries are labelled "CV · …" and link to the CV page, Aswin 2026-11-23) and an `href`.
- **`kb.search`** is a deterministic server function, not the model: it scores entries by keyword/tag overlap with the requirements and returns the top entries from the scopes `roles`, `projects`, `not_done`. No embeddings. Optional `tags` on roles and projects are search words only, never claims.
- `kb.search` reads a frozen, Zod-validated snapshot of `/content/kb` built into the server bundle (`lib/kb/snapshot.ts`). Production leaves out entries that still hold a `TODO(aswin)` placeholder. The last-good copy for the fallback drill is the precomputed `fallback.ts`.

## 7. Fit check — `/api/run` with `mode: "fit"`

The design's honest note is a requirement: **"the fit check is a fixed pipeline with one branch (link or text) and one retry. The model doesn't choose its tools here."**

**Pipeline (stream every step to the UI as it happens, in this order and with these exact tool names):**

| # | Tool | What runs | UI label (the step line is always `{tool} · {label}`; the call forms below are reference only and are no longer shown) |
| --- | --- | --- | --- |
| 1 | `fetch_url` | Only if the input starts with `http(s)://`: server-side fetch with timeout, HTML → text. Otherwise skipped | "Fetching the job post" / "skipped: text was pasted" · X-ray: `fetch_url(url) → page text` / `branch: input is text → skip fetch_url` |
| 2 | `jd.parse` | LLM (`FIT_CHECK_MODEL`), structured output: `requirements: string[]` (≤ 8) | "Reading the job description" · `jd.parse(text) → requirements[]` |
| 3 | `kb.search` | Deterministic search (§6) | "Searching roles, projects and the not-done list" · `kb.search(scope=["roles","projects","not_done"])` |
| 4 | `evidence.map` | LLM, structured output: for each requirement either a match `{req, evidence, sourceId}` or a gap `{req, closest, close}` | "Matching each requirement to evidence" · `evidence.map(requirements, sources)` |
| 5 | `guard.citations` | Deterministic: every match cites a KB `sourceId` that exists; otherwise it becomes a gap | "Every claim cites a source" · `guard.citations(cards)` |
| 6 | `guard.honesty` | Deterministic: verdict counts match the cards, no percentages or scores, not-done topics never appear as matches | "Gaps stated, score not inflated" · `guard.honesty(verdict, gaps)` |
| 7 | `verdict.compose` | Deterministic template: "Strong on {m} of {n} requirements." when m/n ≥ 0.5, else "Not a strong fit: {m} of {n} requirements." Note line as in the design | "Writing the verdict" · `verdict.compose(cards)` |

- **Transport:** NDJSON or SSE events: an optional `{type:"start", runId}`, then `{type:"step", tool, status, detail, ms}` (`status`: `running` | `done` | `skipped`), then exactly one terminal event: `{type:"result", …}` or `{type:"fallback", reason, drill?, runId?, trace?}`. `reason` is `error` (the error state), `limited` (the rate-limited state) or `budget` (the monthly budget is spent, §10). `trace` is the X-ray fallback trace (`HERO_DRILL_TRACE` shape: `[{mark, text, bad, timed, ms?}]`). The running state in the design ("Agent · streaming from the live run") must reflect these real events, never a timer. Zod schemas: `lib/fit-check/types.ts`.
- **Retry:** one retry on a failed LLM or `kb.search` call. If `kb.search` still fails, `guard.no_sources` stops the run and the UI shows the fallback state ("The knowledge base didn't answer, so the AI won't guess.").
- **Result shape** = `HERO_FIT` / `HERO_BAD` in `Hero.dc.html`: `verdict`, `note`, `matches[{req, evidence, source, href}]`, `gaps[{req, closest, close}]`, plus `role` (a short role title that `jd.parse` extracts; the hero shows it, stores it in session memory and pre-fills Contact with it; until it arrives, and in the fallback states, the hero shows `heroSummary` of the pasted JD: a link's first token without `http(s)://` and `www.`, cut to 64 characters, or the text's first line or sentence, cut to 72), `retries` (0 or 1) and `trace {runId, costUsd, ms, model}`. Not-done gaps use "Not something Aswin has done." and leave `close` empty.
- **Samples:** the 4 sample chips (3 fits + "A bad fit, on purpose") send their JD text from the design through the real pipeline.
- **Steps persist after the result:** the steps list stays, headed "Agent · done · 7 steps from the live run".
- **Matches and gaps render as tables at ≥ 640px** and as stacked rows below 640px, exactly as in `Hero.dc.html`.
- **No result footer line.** It is replaced by the X-ray **"This run"** and **"Build details"** panels, shown with X-ray on and a result. "This run" is fed by the run log (§10); "Build details" by build metadata and `eval-results.json`. Eval numbers and live-usage numbers are always labelled separately and never combined.
- **States:** empty, running, result, badfit, error and limited, with the exact copy. "break" is not a state: Break my AI is an X-ray panel below the fit check (see §8).
- **Failure drills** are **out of v1 UI scope** (design update 5: the drill buttons are hidden, `showDrills` is false). Keep the server-side drill path, the fallback UI (error and limited states, precomputed matches, drill trace) and their tests; they serve real outages and rate limits. The home "production" card's CTA reads "Try Break my AI →" (Aswin, 2026-11-23). As built before update 5: the drills ("knowledge base offline", "hit the rate limit") lived in the X-ray Break my AI panel and put the fit check above into its error or limited fallback state. They are real requests with a `drill` flag that force that failure on the server, so the real fallback path runs and its trace is shown in an X-ray panel (`HERO_DRILL_TRACE` is the expected trace). Drills don't call the LLM for the failed step and don't count against the visitor's limit.
- **"How I built this"**: no toggle. The panel shows only when X-ray is on, as an X-ray panel, content exactly as in the design (design update 5: plain-language lists in sans type, no "Honest note", no cost line). Its architecture chips match the step names the API streams (`JD or link` › `fetch_url · links only` › `jd.parse` › `kb.search` › `evidence.map` › `guard.citations` › `guard.honesty` › `verdict.compose`). Its `[placeholders]` come from `/content/site-meta.ts`.

## 8. Ask my work and Break my AI — `/api/run` with `mode: "ask"`

- One prompt over the same knowledge base (whole KB in context with prompt caching; it's small) plus session memory if present.
- **Steps (approved 2026-11-18, design update 2), streamed in this order as they happen:** `kb.search` (deterministic §6 search of the question over every scope; its entry ids go to the model as `<likely_sources>`, and the whole KB stays in context), `compose` (the model call), `guardrails` (the citation and honesty check on the written answer, `guardAsk`). The design lists `guardrails` before `compose`; the real order is kept because the check needs the answer. Ask's thinking state shows these lines: "kb.search · searching the knowledge base", "compose · writing the answer", "guardrails · checking the answer cites a source".
- **Transport:** NDJSON, like the fit check: `{type:"step", tool, status: "running"|"done", ms?}` events, then exactly one `{type:"result", status:"ok", answer}` or `{type:"result", status:"error"|"limited"|"budget"}`. The limit and budget checks run before any step, so a blocked question gets only the result. Zod schemas: `lib/ask/types.ts`. Break my AI reads the same stream (design update 4: this is its "`/api/break` or equivalent" endpoint): the step events drive the attempt's pending state, the result fills it in.
- Structured output: `{ kind: "fit"|"gap"|"none"|"refuse"|"conflict"|"clarify"|"unknown", text, sources: [{label, href}], guard }`.
- `kind` → label and colour exactly as `ASK_LABELS`: gap "PARTIAL · STATED PLAINLY" (amber), none "NOT SOMETHING ASWIN HAS DONE" (amber), refuse "REFUSED · PROMPT INJECTION" (accent), conflict "CONFLICT FLAGGED · GOING WITH THE RECORD" (amber), clarify "NEEDS CLARIFYING" (muted). `unknown` → "The knowledge base doesn't cover that, so there's no answer to give. Try a suggested question, or ask Aswin directly." with a Contact chip.
- Guard names shown in X-ray: `guard.prompt_injection`, `guard.not_done`, `guard.conflicting_info`, `guard.ambiguous_ask`, `guard.gap_stated`, or "none · answered from the knowledge base".
- Every factual answer cites ≥ 1 KB source; a server check drops uncited claims to `unknown`.
- **Break my AI on the hero** (`id="break-my-ai"`) is an X-ray panel shown whenever X-ray is on, in every hero state, below the fit check (which stays usable). It uses the same mode. The UI shows the verdicts from the design: REFUSED / STATED / FLAGGED / CLARIFIED / ANSWERED (mapping: refuse→REFUSED, none→STATED, conflict→FLAGGED, clarify→CLARIFIED, others→ANSWERED), the ATTEMPTS row ("None yet. Your attempts appear here, newest first.", or a tally of squares plus "{held} of {attempts} held up"; session only, last 6 entries) and the guard line, which always shows (the panel is already X-ray).
  - **Pending state (design update 4):** while an attempt runs, its entry shows `RUNNING…`, "Checking the guardrails… {step}", a progress bar and "guardrail: … · trace: …"; the input, chips and drills are disabled and the button reads "Running…". `{step}` and the bar come from the real step events of the run (`kb.search`, `compose`, `guardrails`), never a timer.
  - **Drills are logged** (no drill buttons in v1, design update 5; the entry type stays): each failure drill adds a `DRILL` entry (its reply, "See the fallback above ↑" and "fallback path: {path} · trace {run id}") once the drill's real fallback event arrives. DRILL entries are not counted in attempts, held or the tally.
  - A failed, rate-limited or budget-stopped attempt isn't logged or counted; its pending entry is removed and it shows Ask's error, limit or budget line below the input. Ask's budget line: "Ask my work is paused for this month: the AI budget is spent. Aswin is one message away."
- **Case study "Try to break it"** (`Work.dc.html`) uses `mode: "sandbox"` with a prompt that plays the CloudEagle integration builder and returns `{verdict: BLOCKED|FLAGGED|CLARIFIED|DRAFTED, reason, guard}`. The six preset attacks and their expected verdicts are `WORK_ATTACKS`; they are also eval cases. Its counter reads "No attempts yet" before the first attempt, then "{stopped} held up of {attempts}" (design update 4). The verdict and guard must agree, or the attempt fails closed as an error. States the design doesn't show (approved M5), one line under the input; a failed attempt isn't logged or counted:
  - Loading: "Running against the builder…"
  - Error: "The builder couldn't answer this time. Try again."
  - Limit: "That's the limit for attempts this hour. Aswin is one message away."
  - Budget: "Live attempts are paused for this month."

## 9. Contact form — `/api/contact`

The form lives in the shared Footer (`Footer.dc.html`), so it is on every page; the API and Turnstile protection are the same everywhere. Fields exactly as designed: Name, Work email, Role, Message; button "Send to Aswin". The 6 states are exactly as `Footer.dc.html` / `FooterStates.dc.html` show them (design update 7):

| State | Behaviour |
| --- | --- |
| Ready (`idle`) | Empty form; the role is pre-filled on home after a fit check |
| Invalid | Checked **on send, not while typing**. Required: Name, Work email (looks like `a@b.c`), Message; **Role is optional**. A bad field gets the amber border and background, `aria-invalid`, and its one line via `aria-describedby`: "Add your name." / "Enter an email like name@company.com." / "Add a line or two about the role.". Summary line (`role="alert"`, tag `CHECK`): "One field needs a fix before this can go." / "{n} fields need a fix before this can go.". While invalid, errors are re-checked on every keystroke, so each fix clears at once and the summary goes when nothing is wrong |
| Sending | Only while the real request is in flight: fields `disabled` at 0.6 opacity, button "Sending…" disabled and greyed, three stepping dots and "Sending to Aswin’s inbox" (`role="status"`). The form is `noValidate` and `aria-busy` |
| Sent | "✓ SENT", "Thanks. Your note is with Aswin.", "He replies from his own inbox, usually within {response time}." (`CONTACT_RESPONSE_TIME`). **No auto-reply** to the sender |
| Error | Input kept. Summary line (`role="alert"`, tag `NOT SENT`): "That didn’t go through, but your message is still here. Try again, or reach me another way." with "Send it on WhatsApp instead →". Button "Try again" |
| Rate-limited | Summary line (dashed rule on bg, muted tag `PAUSED`, `role="status"`): "This form takes 3 messages an hour from one connection, to keep spam out. Your message is saved here; send it again in {time}, or right now on WhatsApp." with the WhatsApp link; button disabled and greyed |

Approved where the design is silent (Aswin, 2026-11-23):
- `{time}` is the whole minutes until the window resets, rounded up, from `retryAfterSec`: "1 minute" / "23 minutes". When the window ends, the PAUSED line goes and the button re-enables, with the message still there.
- "Send it on WhatsApp instead →" pre-fills the greeting, a blank line, then the visitor's typed message. The "WhatsApp me" button stays greeting-only.
- The inputs carry `maxLength` equal to the server limits (name 120, role 160, message 5,000), so the limits can't be hit from the form; no new copy.
- The Sending dots keep stepping under `prefers-reduced-motion`.

**API** (`POST /api/contact`): Zod on the server with the same rules (name and message required, valid email, role optional). Turnstile stays; a Turnstile failure is `error`, never `invalid`. Rate limit **3 per hour per connection** (hashed IP, Upstash). Replies: `{ ok: true }`, or `{ ok: false, code: "invalid", fields }`, `{ ok: false, code: "rate_limited", retryAfterSec }` (HTTP 429), `{ ok: false, code: "error" }`. Resend sends only the notification to `CONTACT_TO_EMAIL` from `CONTACT_FROM_EMAIL`, with Reply-To set to the sender. The message is never stored or logged.

**Client:** on any failure the typed message stays in the form and is also kept in `sessionStorage`, so it survives a reload; a successful send clears it.

**Analytics (PostHog):** `contact_whatsapp_click`, `contact_call_click`, `contact_submit` with `outcome` (sent | invalid | error | limited) and `contact_prefilled_role` (boolean). Never the message text.

## 10. Limits, cost, logging, evals

- **Rate limits (Upstash, hashed IP):** fit checks per visitor per day = `FIT_DAILY_LIMIT` (default 10); Ask = 30/hour, shared by Ask my work, Break my AI and the sandbox; failure drills = `FIT_DAILY_LIMIT` per day in their own bucket (the rate drill makes no LLM call and uses no bucket). Over the limit → the hero's "limited" state, no LLM call ("llm.call skipped · nothing billed").
- **Budget cap:** monthly spend counter in Upstash, increased by each run's real cost; at `MONTHLY_BUDGET_USD`, all AI modes return the `budget` state. Hero copy: tag "Fit check · monthly budget reached", title "Live checks are paused for this month.", text "This site caps what it spends on AI each month, and that cap is reached. The precomputed matches below come from the same knowledge base, and Aswin is one message away." Plus a spend limit on the Anthropic workspace.
- **Every model call:** Zod-validated input (JD ≤ 12,000 chars, Ask ≤ 1,000), Turnstile, `maxOutputTokens`, 60 s timeout. User text wrapped in tags and treated as data.
- **Privacy, as the design promises:** pasted JDs and questions are **not stored**. Log only run metrics.

```sql
create table runs (
  id text primary key,            -- the trace/run id shown in X-ray
  created_at timestamptz default now(),
  mode text,                      -- fit | ask | sandbox
  drill text,                     -- null | kb | rate
  branch text,                    -- link | text
  steps jsonb,                    -- [{tool, status, ms}]
  guard_fired text,
  retries int,
  model text,
  input_tokens int, output_tokens int, cached_tokens int,
  cost_usd numeric(10,5),
  latency_ms int,
  prompt_version text,
  requirement_count int,          -- fit only: requirements jd.parse found
  sources_retrieved int,          -- fit only: entries kb.search returned
  sources_cited int,              -- fit only: distinct sources the matches cite
  fallback text                   -- null | error | limited | budget
);
create table ai_crawls (id bigserial primary key, created_at timestamptz default now(), bot text, path text);
```
RLS on; server-only writes; no raw IPs.

- **The run log must provide every "This run" field** (design update 3): run id, timestamp, branch, retries, requirement count, sources retrieved and cited, guard results, fallback used, latency, tokens in/out, cost.

- **Evals (Promptfoo, public in `/evals`):** the 4 sample JDs, ≥ 6 more real JDs (`TODO(aswin)`), every Break-my-AI attack in `HERO_ATTACKS` and `ASK_ANSWERS`, and the 7 case-study eval cases in `Work.dc.html`. Assertions: valid schema, no uncited match, bad fits never "Strong", not-done topics never matched, injections refused, no percentages. CI writes `content/eval-results.json` (pass rate, red-team held, last run date, case count), which the site displays as the offline eval numbers.

## 11. SEO + GEO (invisible, required)

Metadata and OG images per page; JSON-LD `Person` + `ProfilePage` (home, about; on the CV page `Person` carries `alumniOf` IIT Mandi, `hasOccupation` (and `worksFor` while a CV role is current) from `content/cv.ts`, and `sameAs` LinkedIn and GitHub), `Article` (posts), `CreativeWork` (case studies); `robots.ts` allowing OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, GPTBot, ClaudeBot, Google-Extended and disallowing `/api/`; `/llms.txt` + `/llms-full.txt` built from `/content`; all content server-rendered; middleware logs AI-crawler user agents to `ai_crawls`; RSS for the build log.

## 12. Content Aswin must supply (placeholders in the design)

Create these files with `TODO(aswin)` values and a clear comment, and build a `pnpm check:content` script that fails the production build while any `TODO(aswin)` or `[` placeholder text would render:

- `content/kb/*` (roles, projects, not-done list, facts, fallback)
- `content/case-studies/*.mdx` (PRD template fields for every product's study: what I built, time spent, last updated, users/problem, 3 decisions, 4 safeguards, success metrics, before/after steps and times, v2, lessons, links, video)
- `content/hood.ts`: the 12 "How I build agentic products, with proof" items, typed `{ name, status: 'live here'|'case study'|'GitHub'|'shipped'|'prototype'|'planned', proof, cta, href?, live? }` (design update 4)
- `content/products.ts`: the 4 "Products I've built" items, typed `{ num, slug, status, name, pitch, built, flow: {text, human?: boolean}[], tags, primary: {label, href}, secondary: {label, href} }`. `status` is data only; no status pill renders on the desktop cards (design update 4)
- `content/site-meta.ts` (years of experience, eval set link, GitHub, LinkedIn, domain, posting cadence, "what breaks first at scale", "next", cost per run, 90-day plan line)
- `content/posts/*.mdx` (3 designed posts)
- `content/cv.ts` (design update 6): the CV, word for word from `About.dc.html`. Its `[date]` placeholder (the Dhee's website dates) and `#` links stay as placeholders until Aswin fills them; "Synced from my master resume" shows `siteMeta.resumeUpdated`
- `content/certificates.ts`, `public/resume.pdf` (the CV page's "Download PDF" stays `#` until the build-time PDF exists)

Under the hood rule from the design: "Anything without proof yet is left out." A card or case study whose proof isn't filled in is hidden in production, not shown with placeholders.

Placeholders such as `[25]`, `[e.g. …]` and the `#` links in `content/hood.ts` and `content/products.ts` are content to fill (design update 4). Until Aswin fills them they stay visible as placeholders in dev and preview builds, exactly as the artboards show them; never invent the values.

## 13. Environment variables

```
ANTHROPIC_API_KEY=
FIT_CHECK_MODEL=claude-sonnet-5-5
CHAT_MODEL=claude-haiku-5-5
FIT_DAILY_LIMIT=10
MONTHLY_BUDGET_USD=20
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=
# Contact config (design update 7): non-secret but personal, so .env.example keeps them empty.
CONTACT_PHONE=            # E.164, e.g. +91XXXXXXXXXX (wa.me and tel: links)
CONTACT_PHONE_DISPLAY=    # as shown, e.g. +91 …
CONTACT_HOURS=            # e.g. Mon–Fri, 10am–7pm IST
CONTACT_RESPONSE_TIME=    # "usually within …" on the Sent state
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
IP_HASH_SALT=
# Tests only: AI_FAKE=1 swaps in a deterministic fake model and relaxes Turnstile. Refused when VERCEL_ENV=production.
AI_FAKE=
```
Provide `.env.example`. Verify model IDs against Anthropic's current model list before shipping.

## 14. Milestones (one at a time; stop for review after each)

1. **Foundation:** scaffold, tokens + both themes, fonts, Nav (with X-ray toggle + persistence), footer, intro banner, content file skeletons with `TODO(aswin)`.
2. **Static pages, pixel-faithful:** `/` (all sections except the live hero, which shows its empty state), `/work/[slug]` PRD template, `/log`, `/about` (the CV page since design update 6; the dependency graph is gone), mobile layouts. Compare side by side with each artboard.
3. **Ask my work UI:** modal + bottom sheet, ⌘K, per-page suggestions, session memory box, answer card states (wired to a stub first).
4. **Fit-check hero UI:** all states driven by a typed event stream from a local mock that matches §7, so the UI is done before the backend.
5. **Backend:** knowledge base + `kb.search`, `/api/run` (fit, ask, sandbox), streaming, retry, guards, drills, fallbacks, rate limits, budget cap, Turnstile, run logging. Swap the mocks for the real endpoint.
6. **Contact form + analytics + SEO/GEO.**
7. **Quality:** Vitest (guards, verdict template, kb.search, rate-limit helpers), Playwright (each hero state, X-ray toggle, Ask, each of the 6 contact states with the API mocked for error and 429; plus screenshot comparison against the artboards at 1440 and 390), Promptfoo evals + CI writing `eval-results.json`, `check:content`.
8. **Launch checks:** Lighthouse 95+ mobile, accessibility pass (keyboard, focus trap, `aria-live` on streamed output, contrast AA in both themes, reduced motion), README.

## 15. Out of scope for v1

Vector DB / embeddings, user accounts, CMS, tailored resume generation, booking widget (the design uses the contact form), chat thumbs up/down, any page or feature not in `/design`.
