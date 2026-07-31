import { SITE_URL } from "@/lib/site";

// ─────────────────────────────────────────────────────────────
// Shared JSON-LD builder for tool pages (WebPage + BreadcrumbList +
// WebApplication). Mirrors the @context/@graph/@id conventions already
// used in app/layout.tsx (Organization/WebSite) and
// app/articles/[slug]/page.tsx (Article/BreadcrumbList/FAQPage).
// Consumers embed the result via <script type="application/ld+json">.
// ─────────────────────────────────────────────────────────────

export function buildToolJsonLd(opts: {
  name: string;
  description: string;
  path: string; // canonical path เช่น "/tools/xxx"
  breadcrumbLabel: string;
}): object {
  const url = `${SITE_URL}${opts.path}`;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: opts.name,
      description: opts.description,
      inLanguage: "th-TH",
      isPartOf: { "@id": `${SITE_URL}/#website` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "หน้าแรก", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "เครื่องมือ", item: `${SITE_URL}/tools` },
        { "@type": "ListItem", position: 3, name: opts.breadcrumbLabel, item: url },
      ],
    },
    {
      "@type": "WebApplication",
      "@id": `${url}#webapplication`,
      name: opts.name,
      description: opts.description,
      url,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      inLanguage: "th-TH",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      offers: { "@type": "Offer", price: "0", priceCurrency: "THB" },
    },
  ];

  return { "@context": "https://schema.org", "@graph": graph };
}
