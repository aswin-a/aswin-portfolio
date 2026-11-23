import { ImageResponse } from "next/og";
import { siteMeta } from "@/content/site-meta";

/**
 * Text-only Open Graph images (approved in Milestone 6; no OG image is designed): the page title in
 * Newsreader on the page background, a mono eyebrow and the domain. No illustrations or gradients.
 * ImageResponse can't read CSS variables, so the SPEC §3 light tokens are repeated here.
 */
const T = { bg: "#F6F3EC", ink: "#1B1A17", muted: "#5C574E", rule: "#E2DCD0" } as const;

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/** A TrueType subset from Google Fonts (the same families as next/font). Null if offline: the default font is used. */
async function googleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`, {
        signal: AbortSignal.timeout(8000),
      })
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url, { signal: AbortSignal.timeout(8000) })).arrayBuffer();
  } catch {
    return null;
  }
}

export async function ogImage({ title, eyebrow }: { title: string; eyebrow: string }): Promise<ImageResponse> {
  const domain = siteMeta.domain;
  const [serif, mono] = await Promise.all([googleFont("Newsreader", 400, title), googleFont("IBM+Plex+Mono", 400, `${eyebrow}${domain}`)]);
  const fonts = [
    ...(serif ? [{ name: "Newsreader", data: serif, weight: 400 as const, style: "normal" as const }] : []),
    ...(mono ? [{ name: "IBM Plex Mono", data: mono, weight: 400 as const, style: "normal" as const }] : []),
  ];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: T.bg,
          color: T.ink,
        }}
      >
        <div style={{ display: "flex", fontFamily: "IBM Plex Mono", fontSize: 24, letterSpacing: "0.08em", color: T.muted }}>{eyebrow}</div>
        <div style={{ display: "flex", fontFamily: "Newsreader", fontSize: title.length > 60 ? 64 : 80, lineHeight: 1.08, letterSpacing: "-0.015em" }}>
          {title}
        </div>
        <div
          style={{
            display: "flex",
            borderTop: `1px solid ${T.rule}`,
            paddingTop: 28,
            fontFamily: "IBM Plex Mono",
            fontSize: 24,
            color: T.muted,
          }}
        >
          {domain}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
