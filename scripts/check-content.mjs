// Placeholders Aswin still has to fill in (SPEC §12).
//
//   pnpm check:content          list every todo() / TODO(aswin) left in /content (exit 1 if any)
//   --html                      scan the built pages in .next for placeholders that would render: page
//                               text, <title> and meta/OG tags, JSON-LD, text that only renders after
//                               hydration (the RSC payload, e.g. X-ray Build details), and href="#" links
//   --production-only           skip unless VERCEL_ENV=production (used by `pnpm build`)
//
// In production, cards and pages that still contain a todo() are hidden (lib/content.ts),
// so only placeholders that actually render fail the build.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);

function walk(dir, test, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, test, out);
    else if (test(name)) out.push(path);
  }
  return out;
}

/** Visible text of an HTML page: scripts, styles and tags removed. */
export function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'");
}

// "[N]", "[link]", "[e.g. …]": a short bracketed run of text without quotes.
export const PLACEHOLDER = /TODO\(aswin\)|\[[^\]"&<>\n]{1,120}\]/g;

/** Text of a static route body (/about.md, /llms.txt, /llms-full.txt, /rss.xml): markdown link text isn't a placeholder. */
export function bodyText(text) {
  return text.replace(/\[([^\]\n]+)\]\(/g, "$1(");
}
const TEXT_ROUTES = ["about.md.body", "llms.txt.body", "llms-full.txt.body", "rss.xml.body"];

/** Values of <title>, meta tags (description, OG, Twitter) and JSON-LD: they render in search results and link previews. */
export function headText(html) {
  const out = [];
  for (const m of html.matchAll(/<title>([^<]*)<\/title>/g)) out.push(m[1]);
  for (const m of html.matchAll(/<meta\b[^>]*\bcontent="([^"]*)"[^>]*>/g)) out.push(m[1]);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) out.push(m[1]);
  return out.join("\n").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
}

// A placeholder in the RSC payload: a bracket that starts a word. Tailwind's arbitrary values
// ("min-h-[170px]", "md:[...]") are attached to a class name, so they never match.
const PAYLOAD_PLACEHOLDER = /TODO\(aswin\)|(?<![\w\-:\]\[])\[[^\]"&<>\n\\]{1,120}\]/g;

/** Strings in the React Server Components payload: props of client components that render after hydration. */
export function payloadStrings(html) {
  const chunks = [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)]
    .map((m) => {
      try {
        return JSON.parse(m[1]);
      } catch {
        return "";
      }
    })
    .join("");
  return [...chunks.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
}

/** Every placeholder a built page would show, from all of the above. */
export function pagePlaceholders(html) {
  const found = new Set([...(visibleText(html).match(PLACEHOLDER) ?? []), ...(headText(html).match(PLACEHOLDER) ?? [])]);
  for (const s of payloadStrings(html)) for (const f of s.match(PAYLOAD_PLACEHOLDER) ?? []) found.add(f);
  const deadLinks = (html.match(/<a\b[^>]*\bhref="#"/g) ?? []).length;
  if (deadLinks) found.add(`${deadLinks} link(s) to "#"`);
  return [...found];
}

function main() {
  if (args.includes("--production-only") && process.env.VERCEL_ENV !== "production") {
    console.log("check:content skipped (not a production build). Run `pnpm check:content` to see what is left.");
    process.exit(0);
  }
  const hits = [];
  if (args.includes("--html")) {
    const root = ".next/server/app";
    if (!existsSync(root)) {
      console.error("check:content --html: no build output in .next. Run next build first.");
      process.exit(1);
    }
    for (const file of walk(root, (n) => n.endsWith(".html") && !n.startsWith("_"))) {
      for (const f of pagePlaceholders(readFileSync(file, "utf8"))) hits.push(`${file}: ${f}`);
    }
    for (const file of walk(root, (n) => TEXT_ROUTES.includes(n))) {
      const found = new Set(bodyText(readFileSync(file, "utf8")).match(PLACEHOLDER) ?? []);
      for (const f of found) hits.push(`${file}: ${f}`);
    }
    if (!existsSync("public/resume.pdf")) hits.push("public/resume.pdf: missing (linked from About)");
  } else {
    // /content, plus the eval set's real-JD slots (SPEC §10: ≥ 6 real JDs).
    for (const file of [...walk("content", (n) => /\.(ts|tsx|mdx|md|json)$/.test(n)), ...walk("evals/real-jds", (n) => n.endsWith(".txt"))]) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/TODO\(aswin\)|\btodo\(/.test(line)) hits.push(`${file}:${i + 1}`);
        });
    }
  }

  if (hits.length) {
    console.error(`check:content: ${hits.length} placeholder(s) left for Aswin to fill in:`);
    for (const h of hits) console.error(`  ${h}`);
    process.exit(1);
  }
  console.log("check:content: no placeholders left.");
}

// Run as a script; importing it (unit tests) only loads the helpers.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
