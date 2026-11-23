import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import { XrayProvider } from "@/components/xray-provider";
import { DESCRIPTIONS, RSS_ALTERNATE, SITE_NAME, SITE_URL } from "@/lib/seo";
import { THEME_INIT_SCRIPT } from "@/lib/xray";
import "./globals.css";

// SPEC §2: Newsreader (400, 500, 400 italic; opsz 6–72), IBM Plex Sans (400, 500, 600), IBM Plex Mono (400, 500).
// next/font only allows the opsz axis on the variable font, so Newsreader loads its full weight range
// (the design only uses 400, 500 and 400 italic).
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
});
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Aswin — Platform PM who builds for agents",
  description: DESCRIPTIONS.home,
  openGraph: { siteName: SITE_NAME, type: "website", locale: "en" },
  twitter: { card: "summary_large_image" },
  alternates: { types: RSS_ALTERNATE },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the inline script sets data-theme before React hydrates.
    <html lang="en" suppressHydrationWarning className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen">
        <XrayProvider>{children}</XrayProvider>
      </body>
    </html>
  );
}
