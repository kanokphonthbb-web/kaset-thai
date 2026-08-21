import Link from "next/link";
import Script from "next/script";
import { NAV_LINKS } from "@/lib/data";

const KNOWLEDGE_LINKS = [
  { label: "คู่มือเริ่มต้นสำหรับมือใหม่", href: "/articles/raising-laying-hens-for-beginners" },
  { label: "ปลูกข้าว 1 ไร่ ต้นทุนเท่าไหร่", href: "/articles/rice-cost-per-rai" },
  { label: "เลี้ยงปลาดุกในบ่อปูน", href: "/articles/catfish-in-cement-pond" },
  { label: "เกษตรผสมผสาน 1 ไร่", href: "/articles/integrated-farming-1-rai" },
];

const ABOUT_LINKS = [
  { label: "เกี่ยวกับเว็บ", href: "/about" },
  { label: "บทความ", href: "/blog" },
  { label: "เครื่องมือช่วยเกษตรกร", href: "/tools" },
  { label: "อากาศเพื่อการเกษตร", href: "/weather" },
  { label: "ราคาสินค้าเกษตร", href: "/prices" },
  { label: "แดชบอร์ดเกษตรกร", href: "/farm-dashboard" },
  { label: "แหล่งข้อมูลของเรา", href: "/data-sources" },
  { label: "ค้นหาความรู้", href: "/search" },
];

export default function Footer() {
  return (
    <>
      <Script
        id="google-preferred-sources"
        src="https://news.google.com/swg/js/v1/publisher.js"
        strategy="lazyOnload"
      />
      <footer className="mt-section border-t border-linen bg-mist">
        <div className="container-x py-16">
          <section
            aria-labelledby="preferred-source-heading"
            className="mb-12 grid items-center gap-6 rounded-2xl border border-ash/60 bg-paper p-6 shadow-sm sm:p-8 lg:grid-cols-[1fr_auto]"
          >
            <div>
              <p className="eyebrow">ติดตามผ่าน Google</p>
              <h2
                id="preferred-source-heading"
                className="mt-2 font-display text-2xl font-bold text-ink"
              >
                ไม่พลาดความรู้ใหม่จากเกษตรกรไทย
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone sm:text-base">
                เพิ่มเกษตรกรไทยเป็นแหล่งข้อมูลที่ต้องการ เพื่อให้ Google
                ช่วยแสดงบทความจากเราให้คุณเห็นได้ง่ายขึ้น
              </p>
            </div>
            <div className="min-h-[44px] min-w-[240px]">
              <div
                google-add-preferred-source-btn=""
                data-lang="th"
                data-theme="light"
              />
            </div>
          </section>

          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl" aria-hidden>
                  🌾
                </span>
                <span className="font-display text-lg font-bold text-ink">
                  เกษตรกรไทย
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-stone">
                เกษตรกรไทย คือคลังความรู้เกษตรครบวงจร สำหรับคนไทยที่อยากปลูกพืช
                เลี้ยงสัตว์ ลดต้นทุน และสร้างรายได้จากฟาร์ม
              </p>
            </div>

            <FooterCol title="หมวดหลัก" links={NAV_LINKS} />
            <FooterCol title="ความรู้สำคัญ" links={KNOWLEDGE_LINKS} />
            <FooterCol title="เกี่ยวกับเว็บ" links={ABOUT_LINKS} />
          </div>

          <div className="mt-12 border-t border-ash/60 pt-6 text-sm text-stone">
            <p>
              © {new Date().getFullYear()} เกษตรกรไทย · ปลูกเป็น เลี้ยงเป็น
              ทำเกษตรให้มีรายได้
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <nav aria-label={title}>
      <h2 className="eyebrow">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-stone transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
