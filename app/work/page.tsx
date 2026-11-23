import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { ProductsSection } from "@/components/home/products";
import { Nav } from "@/components/nav";
import { DESCRIPTIONS, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Case studies", description: DESCRIPTIONS.work, path: "/work" });

// Design gap (SPEC §4): the home page's "Products I've built" section as a standalone page.
export default function WorkIndex() {
  return (
    <div className="min-h-screen bg-bg font-sans text-ink">
      <Nav current="work" />
      <main>
        <ProductsSection headingLevel={1} anchorBase="/" />
      </main>
      <Footer />
    </div>
  );
}
