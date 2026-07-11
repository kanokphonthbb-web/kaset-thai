// Publish a batch of written articles to Turso (same gate/compile logic as savePostAction).
// Usage: npx tsx scripts/publish-batch.mts <payload.json>
// payload.json = [{ slug, html, seoTitle, metaDescription, focusKeyword, excerpt?, coverImage?, faqs?:[{q,a}], articleType? }]
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { ensureHeadingIds, htmlToAnalysisBlocks, blocksPlainText } from "../lib/blocks";
import { validateArticle } from "../lib/articleValidator";

function loadEnv() {
  // prefer .env.vercel (pulled from Vercel), fall back to process.env
  try {
    const t = readFileSync(new URL("../.env.vercel", import.meta.url), "utf8");
    const e: Record<string, string> = {};
    for (const l of t.split("\n")) {
      const m = l.match(/^([A-Z_]+)=(.*)$/);
      if (m) e[m[1]] = m[2].replace(/^"|"$/g, "");
    }
    return e;
  } catch {
    return process.env as Record<string, string>;
  }
}

function isoTz(d = new Date()) {
  return d.toISOString().replace("Z", "+00:00");
}

// รูปปกตามหมวด — pool ต่อหมวด (Unsplash photo id, WebFetch-verified CDN id) ป้องกันรูปซ้ำ
// ทุก id ผ่านการตรวจสอบจริงจากหน้า Unsplash แล้วว่าตรงกับเนื้อหาหมวดนั้น
const CAT_IMAGE_POOLS: Record<string, string[]> = {
  plants: [
    "1519082572439-7ed19908e47e", // นาข้าว มุมสูง
    "1505471768190-275e2ad7b3f9", // ปลูกข้าว
    "1727099079513-952d40de9d78", // โรงเรือนผัก
    "1615129825073-c47c67bdec5b", // ไร่ข้าวโพด
    "1507637379087-515718ca7c58", // ต้นข้าวโพด
    "1529313780224-1a12b68bed16", // ผักใบเขียว
    "1519897831810-a9a01aceccd1", // เก็บกะหล่ำปลี
    "1727120279660-5c28b8461609", // สวนแอปเปิล
    "1683110752705-f474b57bebc6", // ต้นส้ม
    "1735282260417-cb781d757604", // ชั้นเห็ด
    "1762889278403-1d1a57d9a587", // เพาะเห็ดนางฟ้า
    "1533792344354-ed5e8fc12494", // กระถางสมุนไพร
    "1679321750826-34c10afa2b7d", // กรีดยางพารา
  ],
  animals: [
    "1548550023-2bdb3c5beed7",
    "1538170989343-ce003278e1a3", // ฟาร์มไก่
    "1548781518-d5f5e6a5e281", // ลูกหมู
    "1636998980792-63f27ddea4e3", // วัวในโรงเรือน
    "1498191923457-88552caeccb3", // ฝูงวัวทุ่งหญ้า
    "1549488235-42996ae3b650", // ฝูงวัวทุ่งหญ้า2
    "1677851417571-fd39a3a8d1b9", // เป็ดทุ่งหญ้า
    "1640531783655-95eba670fb00", // เป็ดวิ่ง
    "1593750187970-84858a2aaf5e", // ฝูงแพะ
    "1622837699015-9a4cb8b7a94b", // ฝูงแพะหญ้าเขียว
    // Pexels — เพิ่ม pool เดือน 2026-07 (ไก่เนื้อ/ไก่ไข่ โรงเรือน)
    "https://images.pexels.com/photos/19972937/pexels-photo-19972937.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/30248442/pexels-photo-30248442.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17765441/pexels-photo-17765441.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7790127/pexels-photo-7790127.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15645695/pexels-photo-15645695.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27083552/pexels-photo-27083552.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17064389/pexels-photo-17064389.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/26625882/pexels-photo-26625882.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35877071/pexels-photo-35877071.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15645680/pexels-photo-15645680.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4911711/pexels-photo-4911711.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4530409/pexels-photo-4530409.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  fishery: [
    "1541441056316-443fff347c40",
    "1674962296996-b17a771d44b3", // กุ้ง
    "1717737853712-b6c0e9be4057", // บ่อน้ำ
    "1543285129-bfdac0db10b2", // ปลาคาร์พ
    "1625241481569-65ff5465b148", // ฝูงปลาคาร์พ
    // Pexels — เพิ่ม pool เดือน 2026-07 (บ่อปลา/บ่อกุ้ง เลี้ยงสัตว์น้ำ)
    "https://images.pexels.com/photos/33995746/pexels-photo-33995746.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12349154/pexels-photo-12349154.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/31636077/pexels-photo-31636077.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/29760309/pexels-photo-29760309.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8352786/pexels-photo-8352786.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7509417/pexels-photo-7509417.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5786581/pexels-photo-5786581.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7509424/pexels-photo-7509424.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11035625/pexels-photo-11035625.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/14024725/pexels-photo-14024725.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15059730/pexels-photo-15059730.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5806533/pexels-photo-5806533.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/30780717/pexels-photo-30780717.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "mixed-farming": [
    "1677741447046-2021fb219d3e",
    "1535379453347-1ffd615e2e08", // รถบรรทุกไร่
    "1533062618053-d51e617307ec", // รถแทรกเตอร์เขียว
    "1468253926858-331ac6e1e97f", // รถแทรกเตอร์แดง
    // Pexels — เพิ่ม pool เดือน 2026-07 (แปลงเกษตรผสมผสาน/สวนหลังบ้าน)
    "https://images.pexels.com/photos/15422584/pexels-photo-15422584.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8148241/pexels-photo-8148241.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4894614/pexels-photo-4894614.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37553150/pexels-photo-37553150.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34150447/pexels-photo-34150447.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/730923/pexels-photo-730923.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27176761/pexels-photo-27176761.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27176781/pexels-photo-27176781.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32047262/pexels-photo-32047262.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7457011/pexels-photo-7457011.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8105623/pexels-photo-8105623.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27742375/pexels-photo-27742375.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7299965/pexels-photo-7299965.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  diseases: [
    "1692481060581-98c224124f12",
    "1620055494738-248ba57ed714", // ใบไม้เหลือง
    "1604481986614-e48521951d81", // ใบไม้จุดน้ำตาล
    "1758614307700-1e8ed56dd032", // ใบไม้ตุ่มเหลือง
    "1774427477281-9d4faf8d19d1", // ใบไม้เป็นรู
    "1641118593381-ded30a11d4e1", // แปลงพืชเหี่ยวแล้ง
    "1725318868270-75c8bb45c083", // ต้นข้าวโพดตายแล้ง
    "1633945375508-035305e4275d", // ต้นข้าวโพดเหี่ยวใกล้
    "1758158476251-b1754057722e", // ข้าวโพดแห้งเก็บเกี่ยว
    "1607804384775-9a14cf1f12e5", // ทุ่งข้าวสาลีแห้ง
    // Pexels — เพิ่ม pool เดือน 2026-07 (โรคพืช/แมลงศัตรูพืช/โรคสัตว์/โรคสัตว์น้ำ wave2)
    "https://images.pexels.com/photos/34234358/pexels-photo-34234358.jpeg?auto=compress&cs=tinysrgb&w=1400", // ใบเน่าเป็นเชื้อรา
    "https://images.pexels.com/photos/7718268/pexels-photo-7718268.jpeg?auto=compress&cs=tinysrgb&w=1400", // ใบราแป้ง/ราน้ำค้าง
    "https://images.pexels.com/photos/28166522/pexels-photo-28166522.jpeg?auto=compress&cs=tinysrgb&w=1400", // ใบจุดสีน้ำตาล ใบไหม้
    "https://images.pexels.com/photos/20223372/pexels-photo-20223372.jpeg?auto=compress&cs=tinysrgb&w=1400", // ใบติดเชื้อรา
    "https://images.pexels.com/photos/33995964/pexels-photo-33995964.jpeg?auto=compress&cs=tinysrgb&w=1400", // ใบถูกแมลงกัดเป็นรู (หนอนชอนใบ)
    "https://images.pexels.com/photos/11588748/pexels-photo-11588748.jpeg?auto=compress&cs=tinysrgb&w=1400", // เพลี้ยสีส้มเกาะใบ
    "https://images.pexels.com/photos/16902610/pexels-photo-16902610.jpeg?auto=compress&cs=tinysrgb&w=1400", // เพลี้ยแดงเกาะใบ
    "https://images.pexels.com/photos/20826372/pexels-photo-20826372.jpeg?auto=compress&cs=tinysrgb&w=1400", // เพลี้ยเกาะลำต้น
    "https://images.pexels.com/photos/17333448/pexels-photo-17333448.jpeg?auto=compress&cs=tinysrgb&w=1400", // กลุ่มเพลี้ยแป้งสีเหลือง
    "https://images.pexels.com/photos/3007693/pexels-photo-3007693.jpeg?auto=compress&cs=tinysrgb&w=1400", // มดกับเพลี้ยบนใบ
    "https://images.pexels.com/photos/16667124/pexels-photo-16667124.jpeg?auto=compress&cs=tinysrgb&w=1400", // ฟาร์มไก่ไข่
    "https://images.pexels.com/photos/12246335/pexels-photo-12246335.jpeg?auto=compress&cs=tinysrgb&w=1400", // ไก่รวมฝูงในฟาร์ม
    "https://images.pexels.com/photos/34406262/pexels-photo-34406262.jpeg?auto=compress&cs=tinysrgb&w=1400", // ไก่ในกรงตลาด (แยกกักโรค)
    "https://images.pexels.com/photos/6339152/pexels-photo-6339152.jpeg?auto=compress&cs=tinysrgb&w=1400", // วัวโคนม/โคเนื้อระยะใกล้
    "https://images.pexels.com/photos/8023245/pexels-photo-8023245.jpeg?auto=compress&cs=tinysrgb&w=1400", // วัวติดป้ายหูในทุ่งหญ้า
    "https://images.pexels.com/photos/11357088/pexels-photo-11357088.jpeg?auto=compress&cs=tinysrgb&w=1400", // วัวกินอาหารในฟาร์ม
    "https://images.pexels.com/photos/8839927/pexels-photo-8839927.jpeg?auto=compress&cs=tinysrgb&w=1400", // หมูในโรงเรือน
    "https://images.pexels.com/photos/6791938/pexels-photo-6791938.jpeg?auto=compress&cs=tinysrgb&w=1400", // ฟาร์มหมูภายในโรงเรือน
    "https://images.pexels.com/photos/2737171/pexels-photo-2737171.jpeg?auto=compress&cs=tinysrgb&w=1400", // หมูรวมฝูงในคอก
    "https://images.pexels.com/photos/7509423/pexels-photo-7509423.jpeg?auto=compress&cs=tinysrgb&w=1400", // คนงานดูแลบ่อปลา
    "https://images.pexels.com/photos/28738435/pexels-photo-28738435.jpeg?auto=compress&cs=tinysrgb&w=1400", // บ่อปลากระชังมุมสูง
    "https://images.pexels.com/photos/36519888/pexels-photo-36519888.jpeg?auto=compress&cs=tinysrgb&w=1400", // กบในบ่อน้ำ
    "https://images.pexels.com/photos/35540381/pexels-photo-35540381.jpeg?auto=compress&cs=tinysrgb&w=1400", // กบบนหินริมบ่อ
  ],
  "cost-profit": [
    "1626266061368-46a8f578ddd6", // เครื่องคิดเลขโต๊ะทำงาน
    "1648201637025-1c77b9be3013", // เครื่องคิดเลข+ปากกา
    "1642043175009-5997b3a078d8", // เครื่องคิดเลขบนเอกสาร
    "1611125832047-1d7ad1e8e48f", // เครื่องคิดเลข+ปากกาดำ
    "1544761634-dc512f2238a3", // ปากกา+เครื่องคิดเลข
    "1710625040193-79a7728d7677", // สมุดบันทึกรายรับรายจ่าย
    "1673874855449-e8620ddfa867", // เอกสารการเงินกองซ้อน
    "1649209979970-f01d950cc5ed", // เครื่องคิดเลขบนโต๊ะไม้
    "1546198632-9ef6368bef12", // เอกสารบัญชีตัวเลข
    "1633158829875-e5316a358c6f", // กระปุกออมเหรียญ
    "1578091436046-ecd3f4fe6992", // กระปุกออมเงินเพื่อบ้าน
    "1711344397160-b23d5deaa012",
    "1709880945165-d2208c6ad2ec",
    "1668930185267-1f3c19851b5b",
    "1625225233840-695456021cde",
    "1587145820266-a5951ee6f620",
    "1631511258193-252ab3da6b8b",
    "1648201188793-418f2b9b4b32",
    "1683884361203-69b7f969e9ff",
    "1709534486708-fb8f94150d0a",
    "1653361860636-36f2fb89eab9",
    "1707157284454-553ef0a4ed0d",
    "1628935687655-8530bb7211bc",
    "1707779491435-000c45820db2",
    "1541140911322-98afe66ea6da",
    "1656049471456-cc1d221639d6",
    "1591297331465-be14a181be87",
    "1574884280706-7342ca3d4231",
    "1656049471469-c99e5d2eadd7",
    "1725452119234-187f396623e7",
    "1565514417878-a66a6b0f2c7f",
    "1707299650066-2ad3ac43dc83",
    "1693045181254-08462917f681",
    "1632406895682-4d38b3ac4c7a",
    "1527859117301-9c98fd2a1d1f",
    "1762831063004-bbd3ea38ba3a",
    "1526463167347-75e844ce1ea5",
    "1723889604400-c58f89d9a89d",
    "1658251345087-df33c2fdb2d4",
    "1658251372083-b43eedc5ec90",
    "1708945503671-e6a5d0c4c6b1",
    "1639727712187-c343b440275c",
    "1585915714214-f527f262dd6a",
    "1571429681462-d7b1d8c14758",
    "1632500068545-9c48bc84287a",
    "1663398073649-245bac266d9f",
    "1553490950-4ad206ef9570",
    "1764770704852-4d595f07a6ec",
    "1714041484970-a1c03c4359e9",
    "1696698184542-78a89ba247a2",
    "1669642550102-4715072f1c84",
    // Pexels — เพิ่ม pool เดือน 2026-07 (ปฏิทินงบประมาณ/เอกสารบัญชี/เครื่องคิดเลข) กัน pool หมด เพราะ cost-profit เผยแพร่ไปมากแล้ว
    "https://images.pexels.com/photos/4386341/pexels-photo-4386341.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6962993/pexels-photo-6962993.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/209224/pexels-photo-209224.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/259065/pexels-photo-259065.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6694563/pexels-photo-6694563.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6956131/pexels-photo-6956131.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5466798/pexels-photo-5466798.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/38473092/pexels-photo-38473092.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7054413/pexels-photo-7054413.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5900228/pexels-photo-5900228.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5466800/pexels-photo-5466800.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7054399/pexels-photo-7054399.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/16600134/pexels-photo-16600134.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33175651/pexels-photo-33175651.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7821914/pexels-photo-7821914.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  market: [
    "1579113800032-c38bd7635818",
    "1485637701894-09ad422f6de6", // มะเขือเทศตลาด
    "1550989460-0adf9ea622e2", // แผงผัก
    "1604200657090-ae45994b2451", // แผงผลไม้ริมถนน
    "1488459716781-31db52582fe9", // ผลไม้หลากสี
    "1627989147125-a004d05946d3", // ตะกร้าผักผลไม้
    "1624668430039-0175a0fbf006", // มะเขือเทศในลัง
    "1609842947419-ba4f04d5d60f", // แครอทแตงกวาในตะกร้า
    "1631021967261-c57ee4dfa9bb", // มะเขือเทศตะกร้าไม้สาน
    "1635774855717-0aec182f92cc", // ผักรวมในตะกร้า
    "1690934167884-08c184b6c606", // ตะกร้าสานผลไม้ผัก
    "1720798706592-c516eceaade1", // ตะกร้าใหญ่ผักหลากชนิด
  ],
  "soil-water-fertilizer": [
    "1611843467160-25afb8df1074",
    "1618212624319-3cd9681707e2", // ต้นกล้าในดิน
    "1642952273588-ed6fa28870ac", // กำมือดิน
    "1692369584496-3216a88f94c1", // สปริงเกลอร์
    "1738598665698-7fd7af4b5e0c", // ระบบน้ำไร่ข้าวโพด
    "1710223221719-6251cb1b5c5b", // เม็ดปุ๋ย
    "1587733761376-3f26fc81d17f", // ใบไม้แห้งทำปุ๋ยหมัก
    "1621459565706-3b7612533b15", // ต้นไม้เขียวในดินอุดม
    "1693414853994-1080baaacb4d", // มือหยิบดิน
    "1708437237775-6c89e28913d4", // เศษไม้สับทำปุ๋ย
    "1523349312806-f5dde0a01c32", // ต้นไม้ใบเขียวดินดำ
    // Pexels — เพิ่ม pool เดือน 2026-07 (ดิน/ปุ๋ย/น้ำ/ชลประทาน)
    "https://images.pexels.com/photos/11996945/pexels-photo-11996945.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/21967623/pexels-photo-21967623.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/24260575/pexels-photo-24260575.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/18328388/pexels-photo-18328388.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7299923/pexels-photo-7299923.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5503338/pexels-photo-5503338.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28214180/pexels-photo-28214180.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7728868/pexels-photo-7728868.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7299926/pexels-photo-7299926.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/31110992/pexels-photo-31110992.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17765487/pexels-photo-17765487.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11678428/pexels-photo-11678428.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34182300/pexels-photo-34182300.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33881124/pexels-photo-33881124.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/29067120/pexels-photo-29067120.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/2684805/pexels-photo-2684805.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34344768/pexels-photo-34344768.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/20960018/pexels-photo-20960018.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "agri-tech-tools": [
    "1500382017468-9049fed747ef",
    "1713952160156-bb59cac789a9", // โดรนบินเหนือไร่
    "1634143174678-ecd0c3c2375b", // แทรกเตอร์ขับในไร่
    "1521405924368-64c5b84bec60", // โดรนระยะใกล้
    // Pexels — เพิ่ม pool เดือน 2026-07 (โดรน/โรงเรือน/ระบบน้ำอัตโนมัติ)
    "https://images.pexels.com/photos/34182412/pexels-photo-34182412.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37288723/pexels-photo-37288723.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/1064608/pexels-photo-1064608.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34182315/pexels-photo-34182315.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6792187/pexels-photo-6792187.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/3912469/pexels-photo-3912469.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34182311/pexels-photo-34182311.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/36917505/pexels-photo-36917505.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/19581775/pexels-photo-19581775.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28240873/pexels-photo-28240873.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/36834230/pexels-photo-36834230.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4975400/pexels-photo-4975400.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17797257/pexels-photo-17797257.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33881124/pexels-photo-33881124.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/21675714/pexels-photo-21675714.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "agri-news-law-standards": [
    "1768399808130-abac2a8442e0", // อาคารหน่วยงาน
    "1778080132813-d51b1b36b08e", // เอกสารเก่า
    // Pexels — เพิ่ม pool เดือน 2026-07 (อาคารราชการ/เอกสารกฎหมาย/มาตรฐานรับรอง)
    "https://images.pexels.com/photos/11361969/pexels-photo-11361969.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11105014/pexels-photo-11105014.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9858904/pexels-photo-9858904.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11145683/pexels-photo-11145683.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6358840/pexels-photo-6358840.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8112105/pexels-photo-8112105.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5953737/pexels-photo-5953737.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7163986/pexels-photo-7163986.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12324202/pexels-photo-12324202.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7771973/pexels-photo-7771973.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/48148/pexels-photo-48148.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7054502/pexels-photo-7054502.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
};

/** pool entry เป็นได้ทั้ง Unsplash bare id ("1234-abcd") หรือ full URL (เช่น Pexels) */
function toCoverUrl(entry: string): string {
  if (entry.startsWith("http")) return entry;
  return `https://images.unsplash.com/photo-${entry}?auto=format&fit=crop&w=1400&q=70`;
}

/** เลือกรูปจาก pool ของหมวด โดยข้ามรูปที่ถูกใช้แล้วในหมวดเดียวกัน (กันซ้ำ) */
async function coverFor(
  db: ReturnType<typeof createClient>,
  catSlug: string | undefined,
  slug: string,
  usedThisRun: Set<string>,
): Promise<string> {
  const pool = catSlug ? CAT_IMAGE_POOLS[catSlug] : undefined;
  if (!pool || pool.length === 0) return "";

  const usedRows = await db.execute({
    sql: `SELECT a.coverImage FROM Article a LEFT JOIN ArticleCategory c ON a.categoryId=c.id
          WHERE c.slug=? AND a.coverImage IS NOT NULL AND a.coverImage<>'' AND a.slug<>?`,
    args: [catSlug, slug],
  });
  const usedUrls = new Set<string>();
  for (const r of usedRows.rows) {
    const u = String(r.coverImage || "");
    if (u) usedUrls.add(u);
  }

  const available = pool.filter((entry) => {
    const url = toCoverUrl(entry);
    return !usedUrls.has(url) && !usedThisRun.has(url);
  });
  const candidates = available.length > 0 ? available : pool;
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const entry = candidates[hash % candidates.length];
  const url = toCoverUrl(entry);
  usedThisRun.add(url);
  return url;
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("usage: publish-batch.mts <payload.json>");
  const env = loadEnv();
  const url = env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL missing (run: npx vercel env pull .env.vercel --environment=production)");
  const db = createClient({ url, authToken: env.TURSO_AUTH_TOKEN });

  const items = JSON.parse(readFileSync(file, "utf8")) as any[];
  const published: string[] = [];
  const failed: { slug: string; errors: string[] }[] = [];
  const usedThisRun = new Set<string>();

  for (const a of items) {
    const slug: string = a.slug;
    try {
      const row = (await db.execute({ sql: "SELECT a.id,a.title,a.articleType,c.slug catSlug FROM Article a LEFT JOIN ArticleCategory c ON a.categoryId=c.id WHERE a.slug=?", args: [slug] })).rows[0];
      if (!row) { failed.push({ slug, errors: ["slug not found in DB"] }); continue; }
      const title = String(row.title);
      const articleType = a.articleType || String(row.articleType || "howto");
      const coverImage = (a.coverImage && String(a.coverImage).trim()) ||
        (await coverFor(db, row.catSlug as string | undefined, slug, usedThisRun));
      const html: string = a.html || "";
      const faqs = (a.faqs || []).filter((f: any) => f?.q?.trim() && f?.a?.trim());
      const analysisBlocks = htmlToAnalysisBlocks(html);

      const v = validateArticle({ title, slug, metaDescription: a.metaDescription || "", blocks: analysisBlocks, faqs, articleType });
      if (!v.ok) { failed.push({ slug, errors: v.errors }); continue; }

      const content = ensureHeadingIds(html);
      const excerpt = (a.excerpt?.trim()) || blocksPlainText(analysisBlocks).slice(0, 150);
      const now = isoTz();

      await db.execute({
        sql: `UPDATE Article SET content=?, rawHtml=?, format='html', articleType=?, blocksJson='[]',
              seoTitle=?, metaDescription=?, focusKeyword=?, excerpt=?, coverImage=?, faqJson=?,
              status='published', publishedAt=COALESCE(publishedAt, ?), updatedAt=? WHERE slug=?`,
        args: [content, html, articleType, a.seoTitle || title, a.metaDescription, a.focusKeyword || "",
               excerpt, coverImage, JSON.stringify(faqs), now, now, slug],
      });
      published.push(slug);
    } catch (e: any) {
      failed.push({ slug, errors: [String(e?.message || e)] });
    }
  }

  console.log(JSON.stringify({ published: published.length, failed: failed.length, publishedSlugs: published, failures: failed }, null, 2));
}

main();
