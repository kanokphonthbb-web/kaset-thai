import CategoryPage from "@/components/CategoryPage";
import { categoryMeta } from "@/lib/seo";

export const metadata = categoryMeta("agri-tech-tools", "เทคโนโลยีและเครื่องมือ", "รวมเทคโนโลยีและเครื่องมือเกษตรสำหรับคนไทย โดรน เซนเซอร์ ระบบน้ำอัตโนมัติ แอปเกษตร และ Smart Farm");

export default function Page() {
  return (
    <CategoryPage slug="agri-tech-tools" icon="⚙️" title="เทคโนโลยีและเครื่องมือ"
      intro="เครื่องมือเกษตร โดรน เซนเซอร์ ระบบน้ำอัตโนมัติ แอปช่วยเกษตร และ Smart Farm เพื่อลดแรงงานและเพิ่มผลผลิต"
      topics={["โดรนการเกษตร","ระบบน้ำอัตโนมัติ/สปริงเกลอร์","เซนเซอร์วัดดินและอากาศ","แอปและซอฟต์แวร์จัดการฟาร์ม","เครื่องจักรกลการเกษตร","โซลาร์เซลล์เพื่อการเกษตร"]} />
  );
}
