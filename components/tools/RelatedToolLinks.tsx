"use client";

import Link from "next/link";
import { track, TOOL_EVENTS } from "@/lib/analytics";

// Small shared "related tools/articles" link list for the always-visible
// SEO sections below each calculator's client component. Kept separate
// from each tool's own client component (which handles its own
// result-panel related links) so the tracked click still fires even
// before the user calculates anything.
export default function RelatedToolLinks({
  tool,
  links,
}: {
  tool: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="mt-2 flex flex-col gap-1.5 text-sm">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="text-ink underline decoration-lime-canopy underline-offset-2 hover:text-lime-deep"
          onClick={() => track(TOOL_EVENTS.related_tool_click, { tool, target: l.href })}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
