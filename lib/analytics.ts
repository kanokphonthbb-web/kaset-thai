// ─────────────────────────────────────────────────────────────
// Analytics helper — pushes structured events onto window.dataLayer
// (same dataLayer initialized by components/Analytics.tsx via GTM).
// Safe no-op outside the browser or when GTM isn't configured.
// ─────────────────────────────────────────────────────────────

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export const TOOL_EVENTS = {
  tool_view: "tool_view",
  tool_start: "tool_start",
  tool_submit: "tool_submit",
  tool_result: "tool_result",
  tool_reset: "tool_reset",
  tool_print: "tool_print",
  tool_export: "tool_export",
  related_article_click: "related_article_click",
  related_tool_click: "related_tool_click",
  affiliate_impression: "affiliate_impression",
  affiliate_click: "affiliate_click",
} as const;

export type ToolEvent = (typeof TOOL_EVENTS)[keyof typeof TOOL_EVENTS];

// Allowed payload fields: tool slug/category, result group, product id,
// affiliate category, article slug — NEVER raw user input, personal data,
// or itemized financial figures.
export function track(
  event: string,
  params?: Record<string, string | number | boolean | undefined>,
): void {
  try {
    if (typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
  } catch {
    // never throw from analytics
  }
}
