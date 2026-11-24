/**
 * Which case studies the site links to (Aswin, 2026-11-24). A study that isn't listed here keeps its
 * page at /work/{slug}, but nothing on the site links to it: each link shows its label in muted text
 * with a "COMING SOON" pill, and the page is left out of the sitemap, llms.txt and search indexes.
 *
 * To publish a case study, add its slug, e.g. ["integration-builder"].
 */
export const LIVE_CASE_STUDIES: readonly string[] = [];
