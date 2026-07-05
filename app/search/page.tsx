import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchView from "@/components/SearchView";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "ค้นหาความรู้เกษตร",
  description:
    "ค้นหาความรู้เกษตรจากเกษตรกรไทย ทั้งหมวดความรู้ บทความ และเครื่องมือช่วยคำนวณ ในที่เดียว",
  path: "/search",
  noindex: true,
});

export default function SearchPage() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh]">
        <Suspense fallback={<div className="container-x py-16 text-muted">กำลังโหลด…</div>}>
          <SearchView />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
