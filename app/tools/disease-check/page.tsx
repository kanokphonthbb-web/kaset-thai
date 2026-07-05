import { pageMeta } from "@/lib/seo";
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
    </ToolShell>
  );
}
