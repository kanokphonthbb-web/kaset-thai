import { pageMeta } from "@/lib/seo";
import Link from "next/link";
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

      <div className="cc-tip mt-10">
        <p className="cc-tip-title">วางแผนร่วมกับพยากรณ์อากาศ</p>
        <p>
          ปฏิทินบอกช่วงปลูกที่นิยมตามฤดูกาล ส่วนสภาพอากาศจริงของปีนี้ดูได้จาก{" "}
          <Link href="/weather" className="font-semibold underline">
            พยากรณ์อากาศเพื่อการเกษตรรายจังหวัด
          </Link>{" "}
          และ{" "}
          <Link href="/tools/rain-window-planner" className="font-semibold underline">
            ช่วงฝนน้อยตามพยากรณ์
          </Link>{" "}
          เพื่อเลือกจังหวะเตรียมดินและลงปลูกให้เหมาะกับพื้นที่ของคุณ (ข้อมูลพยากรณ์:
          กรมอุตุนิยมวิทยา)
        </p>
      </div>
    </ToolShell>
  );
}
