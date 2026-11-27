# Code → design sync-back list

Places where the built site differs from the Claude Design prototype, as of 2026-11-26. Each one was checked against the current `/design` files. Sources: SPEC.md, the `(Aswin, date)` notes in the code and the commit history. Apply these in Claude Design so the next export matches the code.

## Global / Nav (`Nav.dc.html`, `Mobile.dc.html`, `MobileNavStates.dc.html`)

1. **The desktop nav is sticky.** It stays above the page but below the Ask scrim. `#anchor` jumps and the case-study sticky rail sit just below it.
2. **The phone header, menu and dock appear on every page,** not just home.
3. **The current page in the phone menu** shows `•` instead of `→` on every page, with `aria-current="page"`. Only StackMobile shows this now.

## Fit-check hero (`Hero.dc.html`, `HeroStates.dc.html`, `MobileFitStates.dc.html`)

4. **The error and limited states have no precomputed matches.** Take them out of both fallback states.
5. **The guard steps don't always say `pass`.** `guard.citations` and `guard.honesty` say what they changed, e.g. `1 match → gap` or `1 gap reworded`. They show `pass` only when they changed nothing.
6. **The result nudge's "Turn on X-ray"** turns X-ray on and then scrolls up to the "This run" panel.
7. **Undo update 9's desktop spacing tweaks.** The JD card padding `20px 22px`, the Break input card padding `20px 22px` and the verdict line-height 1.15 were not built. Desktop keeps the spacing it had before update 9.
8. **A source chip that cites a hidden case study** shows its label as plain muted text, with no link.

## Home (`Main.dc.html`, `Mobile.dc.html`)

9. **The production proof card's CTA is "Try Break my AI →".** Update 11 put "Run the failure drills →" back in `Main.dc.html`, and Aswin confirmed the "Try Break my AI →" wording on 2026-11-26.
10. **Products 01 and 04 have "Add to Claude/ChatGPT" as their primary button,** not "Watch the run →". 01 links to `github.com/aswin-a/linkedin-job-search-agent` and 04 to `github.com/aswin-a/instagram-content-intelligence-agent`. On phones the label gets a trailing `→`.
11. **Phone product cards:**
    - They show no status labels.
    - Product 03 is named "AI integration builder". `MOB_WORK` in `Mobile.dc.html` says "AI integration builder for long-tail apps".
12. **COMING SOON treatment for hidden case studies.** All 4 are hidden at launch.
    - Any link to one shows its label in muted text, without the arrow, plus a dashed "COMING SOON" pill like the "planned" pill.
    - A product card whose two buttons both go to the same hidden study shows one line instead of two.
13. **The planned "mcp server" card** shows the COMING SOON pill instead of its "Coming soon" CTA.
14. **Proof cards that link to a coming-soon post** show the same pill.
15. **The approval step in the desktop product flow is amber,** as on the phone artboard. `Main.dc.html` draws it neutral.

## Ask my work (`Ask.dc.html`, `MobileAsk.dc.html`)

16. **No "Jump to" section.** The placeholder is "Ask about Aswin's work…", without ", or jump to a page".
17. **No "Break my AI" chips in Ask.** Attack questions still get their guarded answers when someone types them.
18. **New `ASK_BY_PAGE` questions:**
    - **home:** Has he worked on APIs? · How does the fit check avoid making things up? · Has he shipped LLM features at a company? · What's his biggest platform win?
    - **work:** Which AI agents has he built? · How does the integration builder keep AI out of production? · Is the integration builder another company's product? · Has he shipped LLM features at a company?
    - **log:** Why does the job-search agent wait for approval? · How do his platform skills carry over to AI agents? · What's he building now?
    - **about:** What's his healthcare experience? · What's his biggest platform win? · What did he build as a founder? · Has he worked with enterprise clients?
19. **Swipe down to close the phone sheet.** You drag from the grab handle or the input row. Past 25% of the sheet's height, or with a quick flick, it closes; otherwise it springs back.
20. **The thinking state's step order** is `kb.search` → `compose` → `guardrails`. The design has guardrails before compose.

## Case study (`Work.dc.html`)

21. **"Try to break it" is gone** from the integration-builder case study.
22. **Integration builder:**
    - Steps with no timing say so.
    - Two of the performance cards are hidden.
    - Filled-in case-study text no longer has the dotted placeholder box.

## Build log (`BuildLog.dc.html`)

23. **Two coming-soon posts are listed:**
    - "Shipping ML OCR with a person in the loop" (tag: human in loop)
    - "Why I advised against sending patient data to LLMs" (tag: data privacy)

    Each shows its tag, a muted title that isn't a link, its summary and the COMING SOON pill. Neither has a post page.
24. **"Platform & API work" no longer exists.** The essay's study link in `BuildLog.dc.html` and the matching item in `Ask.dc.html` (line 131) still point to it.

## Contact (`Footer.dc.html`, `FooterStates.dc.html`), behaviour the design doesn't show

25. **The PAUSED line's `{time}`** is whole minutes, rounded up ("1 minute" / "23 minutes"). When the hour is up, the line goes away and the button works again.
26. **"Send it on WhatsApp instead →"** pre-fills the greeting, a blank line, then the visitor's message. "WhatsApp me" stays greeting-only.

## Stack (`Stack.dc.html`, `StackDiagram.dc.html`, `StackMobile.dc.html`)

27. **No `[link]` placeholders are shown.**
    - A proof card without a real URL is a plain box with no CTA line.
    - The closing "Read the LinkedIn post" button is hidden until the post's URL is set.
28. **Layer 04's proof links** to the job-search agent repo.

## Pages that still need a design

29. **`/work` (the index page):** built as the home "Products I've built" section on its own page, with its own h1.
30. **`/log/[slug]` (a single post):** a serif title, a mono meta line and an 880 px column.

## Everywhere

31. **No company name on the integration builder** (Aswin, 2026-11-27). It's "a Senior PM take-home" now: the breadcrumb is `03 · AI INTEGRATION BUILDER`, the source chip is "Case study · Integration builder", the Ask question is "Is the integration builder another company's product?", and the repo is `github.com/aswin-a/ai-integration-builder`. The local `/design` files already have this; apply it in Claude Design so the next export doesn't bring the name back.

## Not needed in the prototype

These only affect the server or the data: the guard logic, `noindex` on hidden studies, and keeping them out of the sitemap and `llms.txt`.
