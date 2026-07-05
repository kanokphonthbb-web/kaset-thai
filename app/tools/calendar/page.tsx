import { pageMeta } from "@/lib/seo";
import ToolShell from "@/components/ToolShell";
import PlantingCalendar from "@/components/tools/PlantingCalendar";

export const metadata = pageMeta({ title: "ปฏิทินเพาะปลูก", description: "ปฏิทินเพาะปลูกพืชสำหรับเกษตรกรไทย เลือกเดือนแล้วดูว่าควรเริ่มปลูกพืชอะไร พร้อมตารางช่วงเวลาปลูกทั้งปี", path: "/tools/calendar" });

export default function Page({
  searchParams,
}: {
  searchParams: { c?: string };
}) {
  return (
    <ToolShell
      icon="🗓️"
      title="ปฏิทินเพาะปลูก"
      intro="เลือกเดือนที่จะเริ่มปลูก แล้วดูว่าพืชชนิดใดเหมาะกับช่วงนั้น พร้อมตารางช่วงเวลาปลูกทั้งปีเพื่อวางแผนล่วงหน้า"
    >
      <PlantingCalendar initialCrop={searchParams.c} />
    </ToolShell>
  );
}
