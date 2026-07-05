import Link from "next/link";
import type { Tool } from "@/lib/data";

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={tool.href}
      className="group flex h-full flex-col items-start rounded-2xl bg-mist p-6 transition-colors duration-200 hover:bg-linen"
    >
      <span
        aria-hidden
        className="grid h-14 w-14 place-items-center rounded-full bg-lime-canopy text-3xl"
      >
        {tool.icon}
      </span>

      <h3 className="mt-4 font-display text-lg font-bold text-ink">
        {tool.title}
      </h3>
      <p className="mt-2 flex-1 text-sm text-stone">{tool.description}</p>

      <div className="mt-4 flex w-full items-center justify-between">
        <span className="text-xs font-semibold text-stone">{tool.status}</span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
          ใช้เครื่องมือ
          <span
            className="transition-transform group-hover:translate-x-1"
            aria-hidden
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
