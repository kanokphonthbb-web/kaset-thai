import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/data";
import { imageFor } from "@/lib/data";

export default function CategoryCard({ category }: { category: Category }) {
  const img = imageFor(category.slug, 600);

  return (
    <Link
      href={category.href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-mist transition-colors duration-200 hover:bg-linen"
    >
      {/* Real photo cover */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-linen">
        {img ? (
          <Image
            src={img}
            alt={category.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-4xl" aria-hidden>
            {category.icon}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
          <span aria-hidden>{category.icon}</span>
          {category.title}
        </h3>

        <p className="mt-2 flex-1 text-[15px] text-stone">
          {category.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {category.tags.map((tag) => (
            <span key={tag} className="tag-chip text-xs">
              {tag}
            </span>
          ))}
        </div>

        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink">
          ดูเนื้อหา
          <span className="transition-transform group-hover:translate-x-1" aria-hidden>
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
