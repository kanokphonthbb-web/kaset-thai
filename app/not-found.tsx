import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="bg-paper">
        <div className="container-x py-24 text-center">
          <p className="font-display text-6xl font-bold text-lime-canopy">404</p>
          <h1 className="mt-4 font-display text-3xl font-bold text-ink">
            ไม่พบหน้าที่คุณกำลังหา
          </h1>
          <p className="mx-auto mt-3 max-w-md text-stone">
            หน้านี้อาจถูกย้ายหรือยังไม่มีเนื้อหา ลองกลับไปหน้าแรก
            หรือค้นหาความรู้ที่ต้องการได้เลย
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/" className="btn-primary w-full sm:w-auto">
              กลับหน้าแรก
            </Link>
            <Link href="/search" className="btn-secondary w-full sm:w-auto">
              🔍 ค้นหาความรู้
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
