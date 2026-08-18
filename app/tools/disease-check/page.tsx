import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import ToolShell from "@/components/ToolShell";
import DiseaseChecker from "@/components/tools/DiseaseChecker";

export const metadata = pageMeta({ title: "เช็กโรคเบื้องต้น", description: "เครื่องมือเช็กโรคพืชและโรคสัตว์เบื้องต้นสำหรับเกษตรกรไทย เลือกอาการที่พบ แล้วดูสาเหตุและแนวทางป้องกันดูแล", path: "/tools/disease-check" });

export default function Page({
  searchParams,
}: {
  searchParams: { d?: string };
}) {
  return (
    <ToolShell
      icon="🔎"
      title="เช็กโรคเบื้องต้น"
      intro="เลือกกลุ่มและอาการที่พบในพืชหรือสัตว์ แล้วดูว่าน่าจะเป็นโรคอะไร สาเหตุมาจากไหน และมีแนวทางป้องกันดูแลอย่างไร"
    >
      <DiseaseChecker initialName={searchParams.d} />

      <div className="cc-tip mt-10">
        <p className="cc-tip-title">สภาพอากาศกับความเสี่ยงโรค</p>
        <p>
          ช่วงที่ฝนตกต่อเนื่องและความชื้นสูง โรคพืชบางกลุ่ม (เช่น โรคจากเชื้อรา)
          มักพบได้บ่อยขึ้น — เช็ก{" "}
          <Link href="/weather" className="font-semibold underline">
            พยากรณ์อากาศจังหวัดของคุณ
          </Link>{" "}
          ประกอบ แล้วเพิ่มความถี่ในการสำรวจแปลงในช่วงดังกล่าว
          เครื่องมือนี้เป็นการคัดกรองเบื้องต้นเท่านั้น ไม่ใช่การวินิจฉัยโรค
          หากอาการรุนแรงหรือไม่แน่ใจ ควรปรึกษาเจ้าหน้าที่เกษตร/ปศุสัตว์/ประมงในพื้นที่
        </p>
      </div>
    </ToolShell>
  );
}
