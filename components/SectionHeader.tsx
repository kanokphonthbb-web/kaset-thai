export default function SectionHeader({
  eyebrow,
  title,
  desc,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  align?: "center" | "left";
}) {
  const isCenter = align === "center";
  return (
    <div className={isCenter ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mt-4 font-display text-3xl font-bold leading-snug text-ink sm:text-4xl">
        {title}
      </h2>
      {desc && <p className="mt-4 text-stone">{desc}</p>}
    </div>
  );
}
