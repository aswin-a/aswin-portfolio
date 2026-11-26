import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { JD_MAX_CHARS } from "@/lib/fit-check/types";

/**
 * `fetch_url` (SPEC §7): fetches a job post server-side and turns it into text. Visitors choose
 * the URL, so it is locked down against SSRF: http(s) on ports 80/443 only, every hop's host must
 * resolve to a public address, at most 3 redirects, 8 s and 1 MB.
 */

export const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 1_000_000;
const MAX_REDIRECTS = 3;

/**
 * Why a link couldn't be read. `blocked`: the site refused an automated reader (a bot check or an
 * auth wall). `unreadable`: anything else (bad URL, 404, timeout, not a page, no text).
 */
export type FetchFailure = "blocked" | "unreadable";

export class FetchUrlError extends Error {
  constructor(
    message: string,
    readonly kind: FetchFailure = "unreadable",
  ) {
    super(message);
  }
}

/** Statuses job sites send to automated readers: auth walls, bot checks, LinkedIn's 999. */
const BLOCKED_STATUS = new Set([401, 403, 429, 503, 999]);
/** Bot-check pages served with a 200. */
const CHALLENGE_BODY = /<title>\s*Just a moment|challenges\.cloudflare\.com|cf-turnstile|captcha-delivery\.com|px-captcha/i;

/** A Cloudflare (or similar) bot check, by header or status. */
export function isBlocked(res: Response): boolean {
  return res.headers.get("cf-mitigated") === "challenge" || BLOCKED_STATUS.has(res.status);
}

/** The step and trace label for a failed fetch_url (SPEC §7, Aswin 2026-11-26). */
export function fetchFailure(e: unknown): { kind: FetchFailure; cause: string } {
  if (e instanceof FetchUrlError) return { kind: e.kind, cause: e.message };
  const name = (e as { name?: string }).name;
  if (name === "TimeoutError" || name === "AbortError") return { kind: "unreadable", cause: "timeout" };
  return { kind: "unreadable", cause: "no response" };
}

/** True for loopback, private, link-local, CGNAT, multicast, reserved and other non-public ranges. */
export function isPrivateAddress(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (v === 6) {
    const s = ip.toLowerCase();
    if (s === "::" || s === "::1") return true;
    const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(s) || s.startsWith("64:ff9b:") || s.startsWith("2001:db8");
  }
  return true;
}

type Resolver = (host: string) => Promise<string[]>;
const dnsResolver: Resolver = async (host) => (await lookup(host, { all: true, verbatim: true })).map((r) => r.address);

export async function assertPublicUrl(raw: string, resolve: Resolver = dnsResolver): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new FetchUrlError("invalid url");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new FetchUrlError("scheme not allowed");
  if (url.port && url.port !== "80" && url.port !== "443") throw new FetchUrlError("port not allowed");
  if (url.username || url.password) throw new FetchUrlError("credentials not allowed");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addrs = isIP(host) ? [host] : await resolve(host);
  if (addrs.length === 0 || addrs.some(isPrivateAddress)) throw new FetchUrlError("address not allowed");
  return url;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", middot: "·" };

/** HTML → readable text: drops scripts, styles and markup, keeps block breaks, decodes entities. */
export function htmlToText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|head|nav|footer|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(br|\/p|\/div|\/ul|\/ol|\/h[1-6]|\/tr|\/section|\/article)\b[^>]*>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : " ";
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/[ \t\f\v\r]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/**
 * Returns the page text, at most JD_MAX_CHARS (the same cap as a pasted JD). Job posts put the
 * role first, so the cap keeps the part that matters; the cut is never silent to the model:
 * a "[page text truncated]" line marks it.
 */
export async function fetchUrl(raw: string, signal: AbortSignal, resolve?: Resolver, fetchImpl: typeof fetch = fetch): Promise<string> {
  let url = await assertPublicUrl(raw.trim(), resolve);
  const timeout = AbortSignal.any([signal, AbortSignal.timeout(FETCH_TIMEOUT_MS)]);
  for (let hop = 0; ; hop++) {
    const res = await fetchImpl(url, {
      redirect: "manual",
      signal: timeout,
      headers: { accept: "text/html,text/plain;q=0.9", "user-agent": "PortfolioFitCheck/1.0 (+job post reader)" },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      if (hop >= MAX_REDIRECTS) throw new FetchUrlError("too many redirects");
      url = await assertPublicUrl(new URL(res.headers.get("location")!, url).toString(), resolve);
      continue;
    }
    if (isBlocked(res)) throw new FetchUrlError(`${res.status} · bot check`, "blocked");
    if (!res.ok) throw new FetchUrlError(`${res.status}`);
    const type = res.headers.get("content-type") ?? "";
    if (!/text\/html|text\/plain|application\/xhtml/.test(type)) throw new FetchUrlError("not a web page");
    const body = await readCapped(res);
    if (CHALLENGE_BODY.test(body.slice(0, 20_000))) throw new FetchUrlError(`${res.status} · bot check`, "blocked");
    const text = type.includes("text/plain") ? body.trim() : htmlToText(body);
    if (text.length < 40) throw new FetchUrlError("no readable text");
    return text.length > JD_MAX_CHARS ? `${text.slice(0, JD_MAX_CHARS)}\n[page text truncated]` : text;
  }
}
