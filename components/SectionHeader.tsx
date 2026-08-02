export default function SectionHeader({
  eyebrow,
  title,
  desc,
  align = "center",
  headingLevel = 2,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  align?: "center" | "left";
  headingLevel?: 1 | 2;
}) {
  const isCenter = align === "center";
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <div className={isCenter ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <span className="eyebrow">{eyebrow}</span>
      <Heading className="mt-4 font-display text-3xl font-bold leading-snug text-ink sm:text-4xl">
        {title}
      </Heading>
      {desc && <p className="mt-4 text-stone">{desc}</p>}
    </div>
  );
}
