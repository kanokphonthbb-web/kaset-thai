import type { Metadata, Viewport } from "next";
import { Sarabun, Prompt } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import { HERO_IMAGE, unsplashUrl } from "@/lib/data";
import Analytics from "@/components/Analytics";
import "./globals.css";

const DEFAULT_OG = unsplashUrl(HERO_IMAGE, 1200)!;

// Body — clean, highly legible Thai/Latin (Inter-role)
const bodyFont = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});

// Display — geometric grotesk with Thai support (Founders Grotesk-role)
const displayFont = Prompt({
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "เกษตรกรไทย | คลังความรู้เกษตรครบวงจร",
    template: "%s | เกษตรกรไทย",
  },
  description:
    "เกษตรกรไทย คลังความรู้เกษตรครบวงจร สำหรับปลูกพืช เลี้ยงสัตว์ ประมง เกษตรผสมผสาน ต้นทุนกำไร และตลาดเกษตร",
  keywords: [
    "เกษตรกรไทย",
    "ปลูกพืช",
    "เลี้ยงสัตว์",
    "ประมง",
    "เกษตรผสมผสาน",
    "ต้นทุนเกษตร",
    "ตลาดเกษตร",
    "โรคพืช",
    "โรคสัตว์",
  ],
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "เกษตรกรไทย",
    title: "เกษตรกรไทย | คลังความรู้เกษตรครบวงจร",
    description:
      "คลังความรู้เกษตรครบวงจร สำหรับคนไทยที่อยากปลูกพืช เลี้ยงสัตว์ ลดต้นทุน และสร้างรายได้จากฟาร์ม",
    images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: "เกษตรกรไทย" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "เกษตรกรไทย | คลังความรู้เกษตรครบวงจร",
    description:
      "คลังความรู้เกษตรครบวงจร สำหรับคนไทยที่อยากปลูกพืช เลี้ยงสัตว์ ลดต้นทุน และสร้างรายได้จากฟาร์ม",
    images: [DEFAULT_OG],
  },
  alternates: {
    types: { "application/rss+xml": `${SITE_URL}/feed.xml` },
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "เกษตรกรไทย",
      url: SITE_URL,
      slogan: "ปลูกเป็น เลี้ยงเป็น ทำเกษตรให้มีรายได้",
      description:
        "คลังความรู้เกษตรครบวงจร สำหรับคนไทยที่อยากปลูกพืช เลี้ยงสัตว์ ลดต้นทุน และสร้างรายได้จากฟาร์ม",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "เกษตรกรไทย",
      inLanguage: "th-TH",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
