import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/data";
import { imageFor } from "@/lib/data";

export default function ArticleCard({ article }: { article: Article }) {
  const img = imageFor(article.slug, 700);

  return (
    <Link href={`/articles/${article.slug}`} className="group flex h-full flex-col">
      {/* Real photo cover — 20px radius */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-linen">
        {img ? (
          <Image
            src={img}
            alt={article.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-5xl" aria-hidden>
            {article.emoji}
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink">
          {article.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <h3 className="font-display text-lg font-bold text-ink">
          {article.title}
        </h3>
        <p className="mt-2 flex-1 text-sm text-stone">{article.description}</p>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-stone">อ่าน {article.readMinutes} นาที</span>
          <span className="inline-flex items-center gap-1 font-semibold text-ink">
            อ่านต่อ
            <span className="transition-transform group-hover:translate-x-1" aria-hidden>
              →
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
