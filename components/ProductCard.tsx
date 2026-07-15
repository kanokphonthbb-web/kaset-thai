import Link from "next/link";
import Image from "next/image";

// Structural subset — deliberately excludes the outbound link field so this
// component works with any trimmed product shape (e.g. the browse/search list,
// which must never serialize the raw outbound link into client hydration payload).
type CardProduct = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
};

export default function ProductCard({
  product,
  compact = false,
}: {
  product: CardProduct;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group flex h-full flex-col rounded-2xl bg-paper shadow-sm ring-1 ring-ash/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-lime-deep/50 ${
        compact ? "p-2.5" : "p-3"
      }`}
    >
      {/* Product photo — object-contain so photos on white backgrounds don't get cropped */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-mist">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className={`flex flex-1 flex-col ${compact ? "pt-2.5" : "pt-3.5"}`}>
        <h3
          className={`line-clamp-2 font-display font-bold text-ink ${
            compact ? "text-sm" : "text-base"
          }`}
        >
          {product.name}
        </h3>

        <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-ink">
          ดูรายละเอียด
          <span className="transition-transform group-hover:translate-x-1" aria-hidden>
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
