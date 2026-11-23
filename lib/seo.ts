import type { Metadata } from "next";
import { cvHeader, cvItems, type CvItem } from "@/content/cv";
import { siteMeta } from "@/content/site-meta";
import { isTodo } from "@/lib/content";
import { orgName } from "@/lib/cv";
import type { CaseStudy, Post } from "@/lib/schemas/content";

/** The production origin, from content/site-meta.ts (SPEC §11). */
export const SITE_URL = `https://${siteMeta.domain}`;
export const SITE_NAME = "Aswin A";
export const absolute = (path: string) => new URL(path, SITE_URL).toString();

export const RSS_ALTERNATE = { "application/rss+xml": [{ url: "/rss.xml", title: "Build log" }] };

/** Descriptions are the pages' own copy (no new marketing text). */
export const DESCRIPTIONS = {
  home: "I build platforms, AI-powered products, and systems that turn emerging technology into real-world capability.",
  work: "Four AI products, each with a case study written like a PRD: the problem, the trade-offs, the safeguards and what’s next.",
  log: "Notes from building AI products in public.",
  about: cvHeader.summary,
} as const;

/** Title, description, canonical and Open Graph/Twitter text for one page. OG images come from opengraph-image.tsx. */
export function pageMetadata({ title, description, path, type = "website" }: { title?: string; description: string; path: string; type?: "website" | "article" | "profile" }): Metadata {
  return {
    ...(title ? { title } : {}),
    description,
    // Child `alternates` replace the layout's, so the RSS link is repeated on every page.
    alternates: { canonical: path, types: RSS_ALTERNATE },
    openGraph: { type, url: path, siteName: SITE_NAME, description, ...(title ? { title } : {}) },
    twitter: { card: "summary_large_image", description, ...(title ? { title } : {}) },
  };
}

type Json = Record<string, unknown>;

/** A CV role is current when its dates are open-ended ("Oct 2024 –") or run to "Present". None is today, so no worksFor. */
export const isCurrent = (it: CvItem) => /–\s*$|present/i.test(it.dates);

const sameAs = () => [cvHeader.linkedin.href, siteMeta.github].filter((u) => u && !isTodo(u));

/** schema.org Person from content/cv.ts (SPEC §11). `full` adds alumniOf, hasOccupation and worksFor (CV page). */
export function personJsonLd(full = false): Json {
  const person: Json = {
    "@type": "Person",
    "@id": absolute("/#person"),
    name: cvHeader.name,
    url: SITE_URL,
    jobTitle: cvHeader.role.split(" · ")[0],
    description: cvHeader.summary,
    address: { "@type": "PostalAddress", addressLocality: cvHeader.location.split(", ")[0], addressCountry: cvHeader.location.split(", ")[1] },
    sameAs: sameAs(),
  };
  if (!full) return person;
  const work = cvItems.filter((it) => it.lane === "work");
  const edu = cvItems.filter((it) => it.lane === "edu");
  const current = work.filter(isCurrent);
  return {
    ...person,
    alumniOf: edu.map((it) => ({ "@type": "CollegeOrUniversity", name: orgName(it) })),
    hasOccupation: work.map((it) => ({ "@type": "Occupation", name: it.title, description: `${orgName(it)} · ${it.dates}` })),
    ...(current.length ? { worksFor: current.map((it) => ({ "@type": "Organization", name: orgName(it) })) } : {}),
  };
}

export function profilePageJsonLd(path: string, full = false): Json {
  return { "@context": "https://schema.org", "@type": "ProfilePage", url: absolute(path), mainEntity: personJsonLd(full) };
}

const author = () => ({ "@type": "Person", "@id": absolute("/#person"), name: cvHeader.name, url: SITE_URL });

/** A post date like "12 Nov 2026" as ISO; null while it's a placeholder. */
export function isoDate(date: string): string | null {
  if (isTodo(date)) return null;
  const t = Date.parse(`${date} UTC`);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

export function articleJsonLd(p: Post): Json {
  const published = isoDate(p.date);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.summary,
    url: absolute(`/log/${p.slug}`),
    author: author(),
    ...(published ? { datePublished: published } : {}),
  };
}

export function creativeWorkJsonLd(cs: CaseStudy): Json {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: cs.title,
    description: cs.lede,
    url: absolute(`/work/${cs.slug}`),
    author: author(),
    ...(cs.repo && !isTodo(cs.repo) && cs.repo !== "#" ? { sameAs: cs.repo } : {}),
  };
}
