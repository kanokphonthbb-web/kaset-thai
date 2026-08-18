"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

// Fires weather_view once on mount — mirrors components/AffiliateImpressionPing.tsx
export default function WeatherViewPing({ province }: { province: string }) {
  useEffect(() => {
    track("weather_view", { province });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
