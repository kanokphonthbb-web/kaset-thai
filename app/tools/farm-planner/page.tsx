import { pageMeta } from "@/lib/seo";
import { buildToolJsonLd } from "@/lib/toolSeo";
import ToolShell from "@/components/ToolShell";
import AffiliateRecommendations from "@/components/AffiliateRecommendations";
import FarmPlanner from "@/components/tools/FarmPlanner";
import { CATEGORY_PRODUCT_TAGS, type FarmingCategory } from "@/lib/farmPlanner";

const TITLE = "วางแผนว่าควรทำเกษตรอะไรดี";
const DESCRIPTION =
  "เครื่องมือช่วยคัดกรองเบื้องต้นว่าควรเริ่มทำเกษตรแบบไหนดี ใส่พื้นที่ แหล่งน้ำ งบประมาณ เวลา และความสนใจ แล้วดู 3 ทางเลือกที่ควรศึกษาเพิ่มเติม";

export const metadata = pageMeta({
  title: TITLE,
  description: DESCRIPTION,
  path: "/tools/farm-planner",
});

const jsonLd = buildToolJsonLd({
  name: TITLE,
  description: DESCRIPTION,
  path: "/tools/farm-planner",
  breadcrumbLabel: TITLE,
});

const CATEGORIES: FarmingCategory[] = ["plants", "animals", "fishery", "mixed-farming"];

export default function Page() {
  // Pre-render one AffiliateRecommendations (async Server Component) per
  // farming category on the server, then hand the finished nodes down to the
  // client component as props. FarmPlanner (client) can't import/render an
  // async, Prisma-backed Server Component directly — but it can pick which
  // already-rendered slot to display once it knows the top result's category.
  const affiliateSlots = Object.fromEntries(
    CATEGORIES.map((category) => [
      category,
      <AffiliateRecommendations
        key={category}
        tags={CATEGORY_PRODUCT_TAGS[category]}
        heading="อุปกรณ์ที่อาจต้องใช้"
      />,
    ]),
  ) as Record<FarmingCategory, React.ReactNode>;

  return (
    <ToolShell
      icon="🌱"
      title={TITLE}
      intro="ใส่พื้นที่ แหล่งน้ำ งบประมาณ เวลา ประสบการณ์ และความสนใจ แล้วดู 3 ทางเลือกการทำเกษตรที่ควรศึกษาเพิ่มเติม พร้อมเหตุผล งบประมาณ และความเสี่ยงคร่าว ๆ"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FarmPlanner affiliateSlots={affiliateSlots} />
    </ToolShell>
  );
}
