import Link from "next/link";
import Header from "./Header";
import Footer from "./Footer";

export default function ToolShell({
  icon,
  title,
  intro,
  children,
}: {
  icon: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main>
        <section className="bg-mist">
          <div className="container-x py-16">
            <nav aria-label="เส้นทาง" className="text-sm text-stone">
              <Link href="/" className="hover:text-ink">
                หน้าแรก
              </Link>
              <span className="mx-2" aria-hidden>
                /
              </span>
              <Link href="/tools" className="hover:text-ink">
                เครื่องมือ
              </Link>
              <span className="mx-2" aria-hidden>
                /
              </span>
              <span className="font-medium text-ink">{title}</span>
            </nav>

            <div className="mt-6 flex items-start gap-4">
              <span className="text-5xl" aria-hidden>
                {icon}
              </span>
              <div>
                <h1 className="font-display text-4xl font-bold text-ink">
                  {title}
                </h1>
                <p className="mt-3 max-w-2xl text-stone">{intro}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-paper py-16">
          <div className="container-x">{children}</div>
        </section>
      </main>
      <Footer />
    </>
  );
}
