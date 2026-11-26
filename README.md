# Aswin — portfolio

A product manager's portfolio that is itself an AI product. Paste a job description and the site checks it against a knowledge base of real roles and projects, then says plainly where Aswin fits and where not. Turn on **X-ray** to see how each answer was built: the steps, the sources, the guardrails and the cost.

It's live at **[aswin-a.com](https://aswin-a.com)**.

Built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, the Vercel AI SDK and Anthropic Claude.

## What's on the site

| Feature | What it does |
| --- | --- |
| **Fit check** (home hero) | A fixed pipeline streams each step to the page as it runs: `fetch_url` → `jd.parse` → `kb.search` → `evidence.map` → `guard.citations` → `guard.honesty` → `verdict.compose`. It shows up to 10 matches and gaps, with no scores or percentages, and every match cites a source. The guard steps say what they changed. If a job site blocks the link reader, the run stops before any model call and asks for the pasted text instead. |
| **Ask my work** (⌘K / Ctrl+K) | Questions answered from the same knowledge base, with source chips. Suggested questions are picked from what each page shows. Answers can carry on from a fit check through session memory, and "Forget this" clears it. The CV page opens it on a topic ("Ask about this role →"). On phones it's a bottom sheet you can swipe down to close. |
| **X-ray mode** | Reveals inline panels on every page: the live run's trace, build details, "How I built this", and **Break my AI**, a red-team panel for trying prompt injections and other attacks against the real guardrails. |
| **Operating stack** (`/stack`) | "My AI-powered operating stack": Judgment on top, then four layers (thinking and challenging, context, building and communicating, automation), each with its tools, how I use them, my call and a proof card, plus four Judgment rules. A strip under the home hero links to it, and `/stack#layer-N` opens a layer. A markdown twin is at `/stack.md`. |
| **Case studies** (`/work`) | The four products, each written up in a PRD format with before/after views. A case study stays hidden (shown as COMING SOON) until it's published in `content/case-studies/visibility.ts`. |
| **Build log** (`/log`) | Build notes, teardowns, essays and TILs, with filters. |
| **CV** (`/about`) | The CV as a timeline of roles with outcomes, certificates, "Copy as plain text" and a markdown twin at `/about.md`. |
| **Phone layout** (below 640 px) | A phone header and menu, a bottom dock with the X-ray toggle and "Ask my work", a compact fit check, and accordions for the proof section and the product cards. |
| **Contact** (every page) | A contact form with its own ready, invalid, sending, sent, error and rate-limited states, plus WhatsApp and call links. The fit check pre-fills the role. |

## How the AI is kept honest

- **One knowledge base, no vector database.** Everything the AI can say comes from typed files in [`content/kb/`](content/kb) (roles, projects, facts, and a list of things Aswin has *not* done). `kb.search` is a deterministic keyword and tag matcher, not a model.
- **Deterministic guards.** A claim without a real knowledge-base source becomes a gap. Verdict counts must match the cards. Topics from the not-done list are never shown as matches.
- **Real traces only.** The steps, timings, tokens and costs shown in X-ray come from the actual run. Nothing on screen is scripted.
- **Privacy.** Pasted job descriptions and questions are never stored or logged. Only run metrics (steps, tokens, cost, latency) go to Supabase.
- **Guardrails on every model call.** Input is validated with Zod, Cloudflare Turnstile is verified, each visitor is rate-limited, a monthly budget cap applies, and `maxOutputTokens` is set. User text is wrapped and treated as data, and the model has no tools that can change anything.
- **A public eval set.** [`evals/`](evals) runs the sample JDs and every Break my AI attack through the real pipeline with [Promptfoo](https://www.promptfoo.dev/). It checks for valid output, no uncited matches, no "Strong" verdict for a bad fit, no not-done topic as a match, refused injections and no percentages. The eval numbers on the site come only from a real run (see [Evals and CI](#evals-and-ci)).

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components), React 19, TypeScript strict |
| Styling | Tailwind CSS v4, design tokens as CSS variables |
| Content | MDX and typed TypeScript data in [`content/`](content) |
| AI | Vercel AI SDK with `@ai-sdk/anthropic`; model IDs come from env vars |
| Validation | Zod |
| Rate limits and budget | Upstash Redis and `@upstash/ratelimit` |
| Bot protection | Cloudflare Turnstile (invisible) |
| Run logging | Supabase Postgres (metrics only) |
| Tests | Vitest, Playwright (incl. visual baselines) and Promptfoo evals |
| CI | GitHub Actions |

## Getting started

Requires Node.js 22.22+ (Promptfoo's minimum) and pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000.

With no API keys set, use the fake model. It gives deterministic answers and needs no external services:

```bash
AI_FAKE=1 pnpm dev
```

To use the real model, fill in `.env.local`. [`.env.example`](.env.example) explains each variable:

- `ANTHROPIC_API_KEY`, `FIT_CHECK_MODEL`, `CHAT_MODEL`: the model calls
- `UPSTASH_REDIS_REST_URL` / `_TOKEN`: rate limits and the budget counter (without them, a local server falls back to an in-memory store)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`: bot protection (Cloudflare's test keys work locally)
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: run logging (apply the migrations in [`supabase/migrations`](supabase/migrations))
- `FIT_DAILY_LIMIT`, `MONTHLY_BUDGET_USD`, `IP_HASH_SALT`: limits and visitor hashing

`AI_FAKE` is refused in production.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build, then a content check that fails if any placeholder would render |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest unit tests (guards, verdict, `kb.search`, rate limits and budget, evals, content) |
| `pnpm test:e2e` | Playwright end-to-end tests, including screenshot comparison against the baselines at 1440 and 390 px |
| `pnpm test:e2e:update` | Regenerate the screenshot baselines after a deliberate visual change |
| `pnpm evals` | Run the eval set: the real models if `ANTHROPIC_API_KEY` is set (billed), otherwise the fake model as a harness check |
| `pnpm evals:results` | Turn a real eval run into `content/eval-results.json` (refuses a fake run) |
| `pnpm check:content` | List every `TODO(aswin)` and `[placeholder]` still left in the content and the eval set's real-JD slots |

## Evals and CI

- **CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs on every push and pull request: lint, typecheck, unit tests, the eval harness on the fake model, the build, and the Playwright suite with its screenshot baselines. It uses no secrets. Run it by hand with `update-snapshots` ticked to regenerate the baselines on GitHub's runner.
- **Evals** ([`.github/workflows/evals.yml`](.github/workflows/evals.yml)) runs the eval set against the real models when started by hand (`gh workflow run evals.yml --ref main`), or after a push to `main` that changes the evals, prompts, pipeline or knowledge base. It needs the `ANTHROPIC_API_KEY` repository secret. It writes `content/eval-results.json` (cases, pass rate, red-team cases held, last run date) and opens a pull request with only that file. It then starts CI on that pull request itself, because GitHub doesn't run `pull_request` workflows for PRs made with the built-in token (CI skips `pull_request` runs, and pushes to `main`, whose only change is that file). Merging it updates the eval numbers in X-ray's Build details, "How I built this" and the hood card. Eval numbers are offline results and are kept apart from live-usage numbers.

To add a real job description to the eval set, fill one of the slots in [`evals/real-jds/`](evals/real-jds); see [`evals/README.md`](evals/README.md).

## Accessibility and performance

- **Lighthouse (mobile, production build, median of 3 runs):** accessibility, best practices and SEO are 100 on every route, with X-ray on too. Performance is 95–96 on every route except home, at 94 (its fit-check hero makes it the heaviest page).
- **Keyboard:** every control is reachable with Tab and shows the design's focus ring (`2px solid #4F7FC0`, offset 2px). The borderless text fields the design draws without an outline (the job-description box, Break my AI, the Ask inputs) are the only exception. Ask traps focus while it is open and returns it to whatever opened it.
- **Screen readers:** the fit check's streamed steps, Ask's thinking and answer, and Break my AI are polite live regions; the fit-check result heading takes focus when it arrives. Contact-form errors are tied to their fields with `aria-describedby` and `aria-invalid`.
- **Contrast:** every text colour meets WCAG AA on each surface it is used on, on the light page and inside the dark X-ray panels ([`tests/unit/contrast.test.ts`](tests/unit/contrast.test.ts) reads the tokens from `app/globals.css`).
- **Reduced motion:** `prefers-reduced-motion` turns off every transition and animation, and smooth scrolling becomes a jump.
- **Page weight:** PostHog loads only when a key is set, and only once the page is idle, so it is never in the first load. The schemas that run in the browser use `zod/mini`, and the large Newsreader variable font is not preloaded (measured: a preload lowered the mobile score).

[`tests/e2e/a11y.spec.ts`](tests/e2e/a11y.spec.ts) checks the keyboard, focus, live-region, reduced-motion and artboard-attribute rules on every route.

## Deploying

The site runs on Vercel at [aswin-a.com](https://aswin-a.com). To set up a new deployment:

1. Import the GitHub repository as a Vercel project (framework: Next.js, install command `pnpm install`).
2. Set every variable from [`.env.example`](.env.example) for the Production environment. Leave `AI_FAKE` unset: it is refused in production.
3. Apply [`supabase/migrations`](supabase/migrations) to the Supabase project, in order.
4. Verify the sending domain in Resend, add the domain to the Turnstile widget, and set a spend limit on the Anthropic workspace.
5. Point the domain's DNS at Vercel.

A production build (`VERCEL_ENV=production`) runs `check:content` over the built pages and fails while any `TODO(aswin)` or `[placeholder]` would render, so fill the content first: `pnpm check:content` lists what's left.

## Project layout

```
app/              Routes: /, /stack, /work, /work/[slug], /log, /log/[slug], /about, the markdown twins
                  (/about.md, /stack.md), /llms.txt, /llms-full.txt, /rss.xml, /api/run, /api/contact
components/       UI: nav and phone header, dock, fit-check hero, Ask, X-ray panels, case study, home sections, /stack
content/          Everything the site and the AI say
  kb/             Knowledge base: roles, projects, not-done, facts, fallback
  case-studies/   Case studies (MDX)
  posts/          Build log posts (MDX)
lib/
  ai/             Prompts (with PROMPT_VERSION), Zod schemas, model and cost helpers, fake model
  kb/             Knowledge-base snapshot and kb.search
  run/            The /api/run pipelines (fit, ask), guards and verdict
  fit-check/      Fit-check client, types and copy
  ask/            Ask my work client, session memory and copy
  server/         Rate limits, budget, Turnstile, run logging
design/           The approved design artboards (.dc.html), CHANGES.md and STACK-HANDOFF.md (/stack build spec)
evals/            The public eval set (Promptfoo): cases, assertions, provider, real-JD slots
scripts/          check:content, evals and eval-results
supabase/         Database migrations
tests/            unit/ (Vitest) and e2e/ (Playwright, with screenshot baselines in __screenshots__)
.github/          CI and Evals workflows
SPEC.md           The build spec: routes, backend, data, limits
```

## How it's built

[`design/`](design) holds the approved design: interactive HTML prototypes for each page and state. [`SPEC.md`](SPEC.md) turns that design into a build plan, covering routes, the AI pipeline, limits and logging. Design changes are recorded in [`design/CHANGES.md`](design/CHANGES.md) and applied to the code and the spec together. [`CLAUDE.md`](CLAUDE.md) holds the working rules for the AI coding agent that helps build the site.

## Status

Done:
- Foundation
- Static pages
- Ask my work
- Fit-check hero
- Backend (`/api/run`, guards, limits, run logging)
- Contact form, analytics and SEO
- Quality: unit tests, Playwright with screenshot baselines, Promptfoo evals and CI
- Design updates 1–11, including the phone layout (updates 8–10) and the `/stack` page (update 11)
- Launch checks: Lighthouse, accessibility pass, README
- Deployed to Vercel at [aswin-a.com](https://aswin-a.com)

Still to come: the remaining content, such as the hidden case studies, the coming-soon posts and the `/stack` proof links.

Some content is still placeholder text, marked `TODO(aswin)` or `[bracketed]`. `pnpm check:content` lists it.

## License

The code is under the [MIT License](LICENSE). The site's written content, the résumé and the design files are Aswin's own and aren't covered by it.
