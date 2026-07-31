"use client";

import { useEffect } from "react";
import { track, TOOL_EVENTS } from "@/lib/analytics";

// Fires affiliate_impression once on mount (render-time impression, not a true
// viewport-intersection impression — kept simple since AffiliateRecommendations
// itself is a server component and can't call browser APIs directly).
export default function AffiliateImpressionPing({
  count,
  category,
}: {
  count: number;
  category?: string;
}) {
  useEffect(() => {
    track(TOOL_EVENTS.affiliate_impression, { count, category });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
