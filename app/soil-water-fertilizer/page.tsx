import CategoryPage from "@/components/CategoryPage";
import { categoryMeta } from "@/lib/seo";

export const metadata = categoryMeta("soil-water-fertilizer", "ดิน น้ำ ปุ๋ย", "ความรู้เรื่องดิน น้ำ และปุ๋ยสำหรับเกษตรกรไทย ปรับปรุงดิน ระบบน้ำ ปุ๋ยอินทรีย์ ปุ๋ยเคมี และการตรวจวิเคราะห์ดิน");

export default function Page() {
  return (
    <CategoryPage slug="soil-water-fertilizer" icon="🧪" title="ดิน น้ำ ปุ๋ย"
      intro="ปรับปรุงดิน ระบบน้ำ ปุ๋ยอินทรีย์และเคมี การตรวจวิเคราะห์ดิน และการจัดการธาตุอาหารให้พืชโตดี ต้นทุนต่ำ"
      topics={["การตรวจวิเคราะห์ดิน","ปรับปรุงดินเปรี้ยว/ดินเค็ม","ปุ๋ยอินทรีย์และปุ๋ยหมัก","ปุ๋ยเคมีและการใส่ปุ๋ยตามค่าวิเคราะห์","ระบบน้ำและการให้น้ำ","การทำน้ำหมักชีวภาพ"]} />
  );
}
