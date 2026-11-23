// Placeholders Aswin still has to fill in (SPEC §12).
//
//   pnpm check:content          list every todo() / TODO(aswin) left in /content (exit 1 if any)
//   --html                      scan the built pages in .next for placeholders that would render
//   --production-only           skip unless VERCEL_ENV=production (used by `pnpm build`)
//
// In production, cards and pages that still contain a todo() are hidden (lib/content.ts),
// so only placeholders that actually render fail the build.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
if (args.includes("--production-only") && process.env.VERCEL_ENV !== "production") {
  console.log("check:content skipped (not a production build). Run `pnpm check:content` to see what is left.");
  process.exit(0);
}

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

const hits = [];
if (args.includes("--html")) {
  const root = ".next/server/app";
  if (!existsSync(root)) {
    console.error("check:content --html: no build output in .next. Run next build first.");
    process.exit(1);
  }
  for (const file of walk(root, (n) => n.endsWith(".html") && !n.startsWith("_"))) {
    const found = new Set(visibleText(readFileSync(file, "utf8")).match(PLACEHOLDER) ?? []);
    for (const f of found) hits.push(`${file}: ${f}`);
  }
  for (const file of walk(root, (n) => TEXT_ROUTES.includes(n))) {
    const found = new Set(bodyText(readFileSync(file, "utf8")).match(PLACEHOLDER) ?? []);
    for (const f of found) hits.push(`${file}: ${f}`);
  }
  if (!existsSync("public/resume.pdf")) hits.push("public/resume.pdf: missing (linked from About)");
} else {
  for (const file of walk("content", (n) => /\.(ts|tsx|mdx|md|json)$/.test(n))) {
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
