import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { Hero } from "@/components/fit-check/hero";
import { FromTheLog } from "@/components/home/from-the-log";
import { ProductsSection } from "@/components/home/products";
import { StackStrip } from "@/components/home/stack-strip";
import { UnderTheHood } from "@/components/home/under-the-hood";
import { IntroBanner } from "@/components/intro-banner";
import { Nav } from "@/components/nav";
import { siteMeta } from "@/content/site-meta";
import { PROMPT_VERSION } from "@/lib/ai/prompts";
import { cvUpdatedLabel } from "@/lib/cv";
import { hrefOf, isTodo } from "@/lib/content";
import { posts } from "@/lib/posts";
import { DESCRIPTIONS, pageMetadata, profilePageJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ description: DESCRIPTIONS.home, path: "/" });

export default async function Home() {
  const logPosts = await posts();
  return (
    <div className="min-h-screen bg-bg font-sans text-ink">
      <JsonLd data={profilePageJsonLd("/")} />
      <Nav current="home" />
      <IntroBanner />
      <main>
        <div id="top" />
        <Hero
          meta={{
            evalCaseCount: siteMeta.evalCaseCount,
            evalFailedFirst: siteMeta.evalFailedFirst,
            whatBreaksFirstAtScale: siteMeta.whatBreaksFirstAtScale,
            noVectorDbReason: siteMeta.noVectorDbReason,
          }}
          buildMeta={{
            build: `${process.env.BUILD_SHA} · ${process.env.BUILD_DATE}`,
            prompt: PROMPT_VERSION,
            kbSynced: `Synced from master resume ${cvUpdatedLabel()}`,
            offlineEval: `${siteMeta.evalPassed}/${siteMeta.evalTotal} cases · ${siteMeta.evalLastRun}`,
            redTeam: `${siteMeta.evalRedTeamPassed}/${siteMeta.evalRedTeamTotal} held`,
            // Placeholder links render as "#" with the design's " [link]" after the label.
            evalSet: { href: hrefOf(siteMeta.evalSetLink), todo: isTodo(siteMeta.evalSetLink) ? " [link]" : "" },
          }}
        />
        <StackStrip />
        <UnderTheHood />
        <ProductsSection />
        {logPosts.length > 0 && <FromTheLog posts={logPosts} />}
      </main>
      <Footer />
    </div>
  );
}
