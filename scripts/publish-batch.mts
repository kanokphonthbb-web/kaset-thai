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
    // Pexels — เพิ่ม pool เดือน 2026-07 (นาข้าว/แปลงผัก/ไร่ข้าวโพด/สวนผลไม้ — pool ใหญ่เพราะ backlog plants มากสุด)
    "https://images.pexels.com/photos/35559222/pexels-photo-35559222.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/24243611/pexels-photo-24243611.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/3850176/pexels-photo-3850176.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/16592319/pexels-photo-16592319.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35559229/pexels-photo-35559229.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37933142/pexels-photo-37933142.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/16592316/pexels-photo-16592316.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/19371515/pexels-photo-19371515.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27742358/pexels-photo-27742358.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/19031117/pexels-photo-19031117.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/38279065/pexels-photo-38279065.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28102052/pexels-photo-28102052.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/16872660/pexels-photo-16872660.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/3889959/pexels-photo-3889959.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11573790/pexels-photo-11573790.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27176779/pexels-photo-27176779.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28454278/pexels-photo-28454278.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34076809/pexels-photo-34076809.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7543139/pexels-photo-7543139.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34253719/pexels-photo-34253719.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12944752/pexels-photo-12944752.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/16781275/pexels-photo-16781275.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28264138/pexels-photo-28264138.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/3066814/pexels-photo-3066814.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/20987903/pexels-photo-20987903.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32530110/pexels-photo-32530110.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/31095026/pexels-photo-31095026.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/14704981/pexels-photo-14704981.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32530096/pexels-photo-32530096.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28903103/pexels-photo-28903103.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35573254/pexels-photo-35573254.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32530076/pexels-photo-32530076.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  animals: [
    // Pexels — เพิ่ม pool เดือน 2026-07 (ขยายก่อนล็อตเขียนถัดไป)
    "https://images.pexels.com/photos/37466235/pexels-photo-37466235.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15645658/pexels-photo-15645658.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15645665/pexels-photo-15645665.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4911710/pexels-photo-4911710.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/24017332/pexels-photo-24017332.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/22699847/pexels-photo-22699847.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/31548249/pexels-photo-31548249.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/20729021/pexels-photo-20729021.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/2252541/pexels-photo-2252541.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27167732/pexels-photo-27167732.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9768959/pexels-photo-9768959.jpeg?auto=compress&cs=tinysrgb&w=1400",
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
    // Pexels — เพิ่ม pool เดือน 2026-07 (ขยายก่อนล็อตเขียนถัดไป)
    "https://images.pexels.com/photos/9210283/pexels-photo-9210283.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/14024728/pexels-photo-14024728.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32230041/pexels-photo-32230041.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6872322/pexels-photo-6872322.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6416342/pexels-photo-6416342.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/23692726/pexels-photo-23692726.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/16521533/pexels-photo-16521533.jpeg?auto=compress&cs=tinysrgb&w=1400",
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
    // Pexels — เพิ่ม pool เดือน 2026-07 (ขยายก่อนล็อตเขียนถัดไป)
    "https://images.pexels.com/photos/30255157/pexels-photo-30255157.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7765190/pexels-photo-7765190.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/1567791/pexels-photo-1567791.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/14407239/pexels-photo-14407239.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4350649/pexels-photo-4350649.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/3266776/pexels-photo-3266776.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28144221/pexels-photo-28144221.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12387507/pexels-photo-12387507.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8244158/pexels-photo-8244158.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/20111927/pexels-photo-20111927.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28506418/pexels-photo-28506418.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34438780/pexels-photo-34438780.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9954075/pexels-photo-9954075.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37527058/pexels-photo-37527058.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/16360837/pexels-photo-16360837.jpeg?auto=compress&cs=tinysrgb&w=1400",
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
    // Pexels — เพิ่ม pool เดือน 2026-07 (ขยายก่อนล็อตเขียนถัดไป)
    "https://images.pexels.com/photos/23614249/pexels-photo-23614249.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5709282/pexels-photo-5709282.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28654108/pexels-photo-28654108.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/1265627/pexels-photo-1265627.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27087093/pexels-photo-27087093.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/38384704/pexels-photo-38384704.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15484964/pexels-photo-15484964.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/30893338/pexels-photo-30893338.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/10697692/pexels-photo-10697692.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/18380292/pexels-photo-18380292.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33554284/pexels-photo-33554284.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35244807/pexels-photo-35244807.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/30712705/pexels-photo-30712705.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/36791058/pexels-photo-36791058.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/20267214/pexels-photo-20267214.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12062202/pexels-photo-12062202.jpeg?auto=compress&cs=tinysrgb&w=1400",
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
    "https://images.pexels.com/photos/29067120/pexels-photo-29067120.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/2684805/pexels-photo-2684805.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34344768/pexels-photo-34344768.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/20960018/pexels-photo-20960018.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "agri-tech-tools": [
    // Pexels — เพิ่ม pool เดือน 2026-07 (ขยายก่อนล็อตเขียนถัดไป)
    "https://images.pexels.com/photos/34182313/pexels-photo-34182313.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34182409/pexels-photo-34182409.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34182383/pexels-photo-34182383.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34182341/pexels-photo-34182341.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37288742/pexels-photo-37288742.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37288741/pexels-photo-37288741.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/16905006/pexels-photo-16905006.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32079709/pexels-photo-32079709.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/18471551/pexels-photo-18471551.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/18471565/pexels-photo-18471565.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28129605/pexels-photo-28129605.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6510867/pexels-photo-6510867.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15784822/pexels-photo-15784822.jpeg?auto=compress&cs=tinysrgb&w=1400",
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
    // Pexels — เพิ่ม pool เดือน 2026-07 (ขยายก่อนล็อตเขียนถัดไป)
    "https://images.pexels.com/photos/7601056/pexels-photo-7601056.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4468974/pexels-photo-4468974.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/357514/pexels-photo-357514.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5235171/pexels-photo-5235171.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17564642/pexels-photo-17564642.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6950156/pexels-photo-6950156.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27435492/pexels-photo-27435492.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12199410/pexels-photo-12199410.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5622370/pexels-photo-5622370.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4975383/pexels-photo-4975383.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7723731/pexels-photo-7723731.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7821463/pexels-photo-7821463.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8205115/pexels-photo-8205115.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7876043/pexels-photo-7876043.jpeg?auto=compress&cs=tinysrgb&w=1400",
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
    // เพิ่ม pool 2026-07-11 (ขยายรองรับ batch เขียนเนื้อหาใหม่ 21 บทความ — pool เดิมไม่พอ)
    "https://images.pexels.com/photos/8441780/pexels-photo-8441780.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8124222/pexels-photo-8124222.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6445417/pexels-photo-6445417.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7841459/pexels-photo-7841459.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5816300/pexels-photo-5816300.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
};

/** pool entry เป็นได้ทั้ง Unsplash bare id ("1234-abcd") หรือ full URL (เช่น Pexels) */
function toCoverUrl(entry: string): string {
  if (entry.startsWith("http")) return entry;
  return `https://images.unsplash.com/photo-${entry}?auto=format&fit=crop&w=1400&q=70`;
}

// รูปเฉพาะพันธุ์/ชนิด — ใช้ก่อน CAT_IMAGE_POOLS เสมอเมื่อ slug มีคำเหล่านี้ (ยาวสุดที่ match ชนะ)
// ป้องกันปัญหา "รูปไม่ตรงเรื่อง" เช่น บทความปลานิลได้รูปกุ้ง, บทความไก่เนื้อได้รูปหมู
// (พบและแก้ครบทั้งหมวด fishery/animals/plants เมื่อ 2026-07-11 — ทุก id ตรวจ alt-text จาก Pexels API แล้วว่าตรงชนิด)
const KEYWORD_IMAGE_POOLS: Record<string, string[]> = {
  // fishery
  // เพิ่ม pool 2026-07-11 (pad demand จาก draft ใหม่: tilapia+1, seabass+2, silver-barb+2, snakehead+2, carp+2)
  tilapia: ["https://images.pexels.com/photos/15553656/pexels-photo-15553656.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/14924016/pexels-photo-14924016.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/8352786/pexels-photo-8352786.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/32262908/pexels-photo-32262908.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  catfish: ["https://images.pexels.com/photos/19040471/pexels-photo-19040471.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/33445044/pexels-photo-33445044.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/33560903/pexels-photo-33560903.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/4619577/pexels-photo-4619577.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  seabass: ["https://images.pexels.com/photos/2042564/pexels-photo-2042564.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/26622789/pexels-photo-26622789.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/7509420/pexels-photo-7509420.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/37052317/pexels-photo-37052317.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "silver-barb": ["https://images.pexels.com/photos/7509417/pexels-photo-7509417.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/14024728/pexels-photo-14024728.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/27170715/pexels-photo-27170715.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/32243189/pexels-photo-32243189.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  snakehead: ["https://images.pexels.com/photos/14024725/pexels-photo-14024725.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/5806533/pexels-photo-5806533.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/37052302/pexels-photo-37052302.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/8878987/pexels-photo-8878987.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  carp: ["https://images.pexels.com/photos/33995746/pexels-photo-33995746.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/9210283/pexels-photo-9210283.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/36707253/pexels-photo-36707253.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/32763515/pexels-photo-32763515.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  // เพิ่ม pool 2026-07-11 (wave: market/mixed-farming/fishery)
  "giant-river-prawn": [
    "https://images.pexels.com/photos/28240644/pexels-photo-28240644.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17714806/pexels-photo-17714806.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17091518/pexels-photo-17091518.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17714805/pexels-photo-17714805.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32230039/pexels-photo-32230039.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/16582780/pexels-photo-16582780.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "white-shrimp": [
    "https://images.pexels.com/photos/25014833/pexels-photo-25014833.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32230044/pexels-photo-32230044.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32230042/pexels-photo-32230042.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4220575/pexels-photo-4220575.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/29159795/pexels-photo-29159795.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33202175/pexels-photo-33202175.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "rice-field-crab": [
    "https://images.pexels.com/photos/27903821/pexels-photo-27903821.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/20733863/pexels-photo-20733863.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/29266015/pexels-photo-29266015.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15375862/pexels-photo-15375862.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34350999/pexels-photo-34350999.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "freshwater-snail": [
    "https://images.pexels.com/photos/35674134/pexels-photo-35674134.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27017090/pexels-photo-27017090.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/30340278/pexels-photo-30340278.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35855779/pexels-photo-35855779.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37499917/pexels-photo-37499917.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  frog: [
    "https://images.pexels.com/photos/32146740/pexels-photo-32146740.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33397130/pexels-photo-33397130.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11747503/pexels-photo-11747503.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15578668/pexels-photo-15578668.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17506293/pexels-photo-17506293.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "golden-apple-snail-feed": [
    "https://images.pexels.com/photos/4954783/pexels-photo-4954783.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33907958/pexels-photo-33907958.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4937495/pexels-photo-4937495.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9243150/pexels-photo-9243150.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/18505758/pexels-photo-18505758.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "biofloc-small-farm": [
    "https://images.pexels.com/photos/32418620/pexels-photo-32418620.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/19780693/pexels-photo-19780693.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5640315/pexels-photo-5640315.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12683413/pexels-photo-12683413.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9890560/pexels-photo-9890560.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/29994589/pexels-photo-29994589.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5999546/pexels-photo-5999546.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12250553/pexels-photo-12250553.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "canvas-pond-fish": [
    "https://images.pexels.com/photos/6496652/pexels-photo-6496652.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/36108526/pexels-photo-36108526.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9580802/pexels-photo-9580802.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28163721/pexels-photo-28163721.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35153367/pexels-photo-35153367.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/36336721/pexels-photo-36336721.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/30879837/pexels-photo-30879837.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33473054/pexels-photo-33473054.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "fish-pond-mixed-farm": [
    "https://images.pexels.com/photos/17355150/pexels-photo-17355150.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37052316/pexels-photo-37052316.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17355219/pexels-photo-17355219.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15837234/pexels-photo-15837234.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/10751394/pexels-photo-10751394.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37052312/pexels-photo-37052312.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/26245908/pexels-photo-26245908.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4830329/pexels-photo-4830329.jpeg?auto=compress&cs=tinysrgb&w=1400",
    // เพิ่ม 2026-07-11: pool มี 8 แต่ fish-pond-mixed-farm-* มี 9 slugs รวมทั้งไฟล์ (31-39) ต้องมี 9 รูปกันซ้ำ
    "https://images.pexels.com/photos/27155972/pexels-photo-27155972.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "stocking-density": [
    "https://images.pexels.com/photos/8598668/pexels-photo-8598668.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11331533/pexels-photo-11331533.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5941921/pexels-photo-5941921.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35181050/pexels-photo-35181050.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/14021516/pexels-photo-14021516.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28738437/pexels-photo-28738437.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17014397/pexels-photo-17014397.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/29123275/pexels-photo-29123275.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "water-quality-pond": [
    "https://images.pexels.com/photos/30824856/pexels-photo-30824856.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5561792/pexels-photo-5561792.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/16678045/pexels-photo-16678045.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34076256/pexels-photo-34076256.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/36626516/pexels-photo-36626516.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12220818/pexels-photo-12220818.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5795822/pexels-photo-5795822.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28542761/pexels-photo-28542761.jpeg?auto=compress&cs=tinysrgb&w=1400",
    // เพิ่ม pool 2026-07-11 (batch p2: water-quality-pond มี 9 slugs (50-90) pool เดิมมี 8 ไม่พอ)
    "https://images.pexels.com/photos/3141709/pexels-photo-3141709.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  // animals
  // เพิ่ม pool 2026-07-12 (21 species clusters padded/created — pools ที่มีอยู่เดิมเล็กเกินไปหรือไม่มีเลย ทำให้ fallback ไป generic pool ผิด species)
  broiler: [
    "https://images.pexels.com/photos/27083552/pexels-photo-27083552.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35877057/pexels-photo-35877057.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/26625882/pexels-photo-26625882.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17064389/pexels-photo-17064389.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32840073/pexels-photo-32840073.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12995535/pexels-photo-12995535.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/2253583/pexels-photo-2253583.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35877058/pexels-photo-35877058.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12995533/pexels-photo-12995533.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  goose: [
    "https://images.pexels.com/photos/19203116/pexels-photo-19203116.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37902824/pexels-photo-37902824.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/36931235/pexels-photo-36931235.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/31927964/pexels-photo-31927964.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/19721229/pexels-photo-19721229.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27329687/pexels-photo-27329687.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/19985722/pexels-photo-19985722.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  duck: ["https://images.pexels.com/photos/11700747/pexels-photo-11700747.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/28505058/pexels-photo-28505058.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/28505047/pexels-photo-28505047.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/12741625/pexels-photo-12741625.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  quail: [
    "https://images.pexels.com/photos/4530404/pexels-photo-4530404.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4530408/pexels-photo-4530408.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34944214/pexels-photo-34944214.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4530403/pexels-photo-4530403.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4530395/pexels-photo-4530395.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/13969420/pexels-photo-13969420.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4530410/pexels-photo-4530410.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "native-chicken": [
    "https://images.pexels.com/photos/35282555/pexels-photo-35282555.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/31099676/pexels-photo-31099676.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5649238/pexels-photo-5649238.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32327956/pexels-photo-32327956.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34421199/pexels-photo-34421199.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/13427991/pexels-photo-13427991.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8807303/pexels-photo-8807303.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "fattening-pig": [
    "https://images.pexels.com/photos/8839927/pexels-photo-8839927.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6791938/pexels-photo-6791938.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/2737171/pexels-photo-2737171.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4636976/pexels-photo-4636976.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/2737175/pexels-photo-2737175.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4892760/pexels-photo-4892760.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/26841069/pexels-photo-26841069.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "layer-chicken": [
    "https://images.pexels.com/photos/4911711/pexels-photo-4911711.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35877061/pexels-photo-35877061.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/16667124/pexels-photo-16667124.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33869135/pexels-photo-33869135.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5194459/pexels-photo-5194459.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/18474435/pexels-photo-18474435.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8794417/pexels-photo-8794417.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15645725/pexels-photo-15645725.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/13690434/pexels-photo-13690434.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15645670/pexels-photo-15645670.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "beef-cattle": [
    "https://images.pexels.com/photos/7164014/pexels-photo-7164014.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/953966/pexels-photo-953966.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34154010/pexels-photo-34154010.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/2253557/pexels-photo-2253557.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11684987/pexels-photo-11684987.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34211212/pexels-photo-34211212.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  buffalo: [
    "https://images.pexels.com/photos/7207169/pexels-photo-7207169.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/2261770/pexels-photo-2261770.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/19848150/pexels-photo-19848150.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/13180841/pexels-photo-13180841.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/19183783/pexels-photo-19183783.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "fattening-cattle": [
    "https://images.pexels.com/photos/27568762/pexels-photo-27568762.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/30649707/pexels-photo-30649707.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17466300/pexels-photo-17466300.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4731089/pexels-photo-4731089.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4731098/pexels-photo-4731098.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5216140/pexels-photo-5216140.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  cricket: [
    "https://images.pexels.com/photos/6037816/pexels-photo-6037816.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4716888/pexels-photo-4716888.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12668990/pexels-photo-12668990.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/26998896/pexels-photo-26998896.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/23524542/pexels-photo-23524542.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "dairy-cow": [
    "https://images.pexels.com/photos/12821244/pexels-photo-12821244.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4910809/pexels-photo-4910809.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/69170/pexels-photo-69170.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4910823/pexels-photo-4910823.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/2887110/pexels-photo-2887110.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "dairy-goat": [
    "https://images.pexels.com/photos/5953665/pexels-photo-5953665.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5953799/pexels-photo-5953799.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6733517/pexels-photo-6733517.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5953800/pexels-photo-5953800.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5953803/pexels-photo-5953803.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "deep-litter-pig": [
    "https://images.pexels.com/photos/16207036/pexels-photo-16207036.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/31116486/pexels-photo-31116486.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/31116488/pexels-photo-31116488.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/29932539/pexels-photo-29932539.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/18831697/pexels-photo-18831697.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  earthworm: [
    "https://images.pexels.com/photos/32405442/pexels-photo-32405442.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4205891/pexels-photo-4205891.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/20876111/pexels-photo-20876111.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/31416070/pexels-photo-31416070.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/38025863/pexels-photo-38025863.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "layer-duck": [
    "https://images.pexels.com/photos/9664253/pexels-photo-9664253.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28505046/pexels-photo-28505046.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28505042/pexels-photo-28505042.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12741635/pexels-photo-12741635.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37744863/pexels-photo-37744863.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32183092/pexels-photo-32183092.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/36350338/pexels-photo-36350338.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "meat-duck": [
    "https://images.pexels.com/photos/27924175/pexels-photo-27924175.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/16901775/pexels-photo-16901775.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28124031/pexels-photo-28124031.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28505054/pexels-photo-28505054.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28505049/pexels-photo-28505049.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/30283576/pexels-photo-30283576.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/38159549/pexels-photo-38159549.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "meat-goat": [
    "https://images.pexels.com/photos/18748123/pexels-photo-18748123.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8627918/pexels-photo-8627918.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/16725950/pexels-photo-16725950.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/3089482/pexels-photo-3089482.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/14688313/pexels-photo-14688313.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  rabbit: [
    "https://images.pexels.com/photos/33223459/pexels-photo-33223459.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17949209/pexels-photo-17949209.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/2397448/pexels-photo-2397448.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/18063451/pexels-photo-18063451.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28623953/pexels-photo-28623953.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  sheep: [
    "https://images.pexels.com/photos/34158097/pexels-photo-34158097.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/29449085/pexels-photo-29449085.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12555344/pexels-photo-12555344.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6342281/pexels-photo-6342281.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12209502/pexels-photo-12209502.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  silkworm: [
    "https://images.pexels.com/photos/4543909/pexels-photo-4543909.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6875096/pexels-photo-6875096.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/23884132/pexels-photo-23884132.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4543864/pexels-photo-4543864.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4543907/pexels-photo-4543907.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  sow: [
    "https://images.pexels.com/photos/27596691/pexels-photo-27596691.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/29485402/pexels-photo-29485402.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11155920/pexels-photo-11155920.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37072999/pexels-photo-37072999.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6416106/pexels-photo-6416106.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  // plants
  "rice-jasmine": ["https://images.pexels.com/photos/35559229/pexels-photo-35559229.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/37933142/pexels-photo-37933142.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/15879425/pexels-photo-15879425.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "sticky-rice": ["https://images.pexels.com/photos/17001692/pexels-photo-17001692.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/36346840/pexels-photo-36346840.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/32200253/pexels-photo-32200253.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  riceberry: ["https://images.pexels.com/photos/30756211/pexels-photo-30756211.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  cassava: ["https://images.pexels.com/photos/28454278/pexels-photo-28454278.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/36846177/pexels-photo-36846177.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  chili: ["https://images.pexels.com/photos/13222684/pexels-photo-13222684.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/13220059/pexels-photo-13220059.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "chinese-cabbage": ["https://images.pexels.com/photos/31782675/pexels-photo-31782675.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/36282128/pexels-photo-36282128.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  cucumber: ["https://images.pexels.com/photos/31737291/pexels-photo-31737291.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/36628247/pexels-photo-36628247.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "feed-corn": ["https://images.pexels.com/photos/20234940/pexels-photo-20234940.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/1382102/pexels-photo-1382102.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "sweet-corn": ["https://images.pexels.com/photos/13566357/pexels-photo-13566357.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/13054496/pexels-photo-13054496.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  mungbean: ["https://images.pexels.com/photos/18358654/pexels-photo-18358654.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/7420815/pexels-photo-7420815.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "oil-palm": ["https://images.pexels.com/photos/3246159/pexels-photo-3246159.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/10269220/pexels-photo-10269220.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  peanut: ["https://images.pexels.com/photos/33303300/pexels-photo-33303300.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/18900465/pexels-photo-18900465.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  rubber: ["https://images.pexels.com/photos/36312566/pexels-photo-36312566.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/11425870/pexels-photo-11425870.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  sesame: ["https://images.pexels.com/photos/17362929/pexels-photo-17362929.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  soybean: ["https://images.pexels.com/photos/38328331/pexels-photo-38328331.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/36893984/pexels-photo-36893984.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  sugarcane: ["https://images.pexels.com/photos/11466855/pexels-photo-11466855.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/38302386/pexels-photo-38302386.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "sweet-potato": ["https://images.pexels.com/photos/2797398/pexels-photo-2797398.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/2889344/pexels-photo-2889344.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  // diseases/pests (found 14 of 15 published diseases articles mismatched on 2026-07-11 — same root cause)
  "asf-pig": ["https://images.pexels.com/photos/2737171/pexels-photo-2737171.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "downy-mildew": ["https://images.pexels.com/photos/7718268/pexels-photo-7718268.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "fish-water-shock": ["https://images.pexels.com/photos/5786581/pexels-photo-5786581.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "fmd-cattle": ["https://images.pexels.com/photos/8023245/pexels-photo-8023245.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "frog-disease": ["https://images.pexels.com/photos/9124980/pexels-photo-9124980.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "golden-apple-snail": ["https://images.pexels.com/photos/37616450/pexels-photo-37616450.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "layer-chicken-diseases": ["https://images.pexels.com/photos/16667124/pexels-photo-16667124.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "leaf-blight": ["https://images.pexels.com/photos/28166522/pexels-photo-28166522.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "leaf-miner": ["https://images.pexels.com/photos/33806232/pexels-photo-33806232.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  mealybug: ["https://images.pexels.com/photos/32343531/pexels-photo-32343531.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "root-rot": ["https://images.pexels.com/photos/4751971/pexels-photo-4751971.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  thrips: ["https://images.pexels.com/photos/12016351/pexels-photo-12016351.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "weed-control": ["https://images.pexels.com/photos/5410777/pexels-photo-5410777.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  whitefly: ["https://images.pexels.com/photos/2974409/pexels-photo-2974409.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "yellow-leaves": ["https://images.pexels.com/photos/5978538/pexels-photo-5978538.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  // mixed-farming model pairs (found 8 of 8 published "mixed-model-X-Y" articles mismatched on 2026-07-11)
  "deep-litter-pig-manure": ["https://images.pexels.com/photos/16469478/pexels-photo-16469478.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "mixed-model-fish-vegetables": ["https://images.pexels.com/photos/16311186/pexels-photo-16311186.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "goat-forage": ["https://images.pexels.com/photos/36861200/pexels-photo-36861200.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "mushroom-earthworm": ["https://images.pexels.com/photos/2478421/pexels-photo-2478421.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "napier-cattle": ["https://images.pexels.com/photos/12204342/pexels-photo-12204342.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "orchard-native-chicken": ["https://images.pexels.com/photos/36215493/pexels-photo-36215493.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "rice-fish-duck": ["https://images.pexels.com/photos/36965358/pexels-photo-36965358.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "mixed-model-veg-chicken": ["https://images.pexels.com/photos/30319491/pexels-photo-30319491.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  // เพิ่ม pool 2026-07-11 (wave: market/mixed-farming/fishery)
  "buy-farmland-checklist": [
    "https://images.pexels.com/photos/14745185/pexels-photo-14745185.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9670372/pexels-photo-9670372.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/16902638/pexels-photo-16902638.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/31722504/pexels-photo-31722504.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4975391/pexels-photo-4975391.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/18748575/pexels-photo-18748575.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/18431204/pexels-photo-18431204.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9492160/pexels-photo-9492160.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "family-farm-system": [
    "https://images.pexels.com/photos/36395962/pexels-photo-36395962.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37788217/pexels-photo-37788217.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5529950/pexels-photo-5529950.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35615070/pexels-photo-35615070.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4894606/pexels-photo-4894606.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33944753/pexels-photo-33944753.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32415694/pexels-photo-32415694.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4084710/pexels-photo-4084710.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "farm-12-month-plan": [
    "https://images.pexels.com/photos/2381848/pexels-photo-2381848.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7550894/pexels-photo-7550894.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/760720/pexels-photo-760720.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5417628/pexels-photo-5417628.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5417636/pexels-photo-5417636.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27200470/pexels-photo-27200470.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5417693/pexels-photo-5417693.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15635242/pexels-photo-15635242.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "farm-accounting": [
    "https://images.pexels.com/photos/164686/pexels-photo-164686.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8297225/pexels-photo-8297225.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12983115/pexels-photo-12983115.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8296974/pexels-photo-8296974.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7821689/pexels-photo-7821689.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8297034/pexels-photo-8297034.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8296948/pexels-photo-8296948.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6694916/pexels-photo-6694916.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "farm-cost-saving": [
    "https://images.pexels.com/photos/9929281/pexels-photo-9929281.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6863252/pexels-photo-6863252.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9821387/pexels-photo-9821387.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9755390/pexels-photo-9755390.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/259209/pexels-photo-259209.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6774947/pexels-photo-6774947.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11348150/pexels-photo-11348150.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/18501298/pexels-photo-18501298.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "farm-labor-plan": [
    "https://images.pexels.com/photos/9051683/pexels-photo-9051683.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11678438/pexels-photo-11678438.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33596704/pexels-photo-33596704.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11678427/pexels-photo-11678427.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11678442/pexels-photo-11678442.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11678441/pexels-photo-11678441.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9798988/pexels-photo-9798988.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35095347/pexels-photo-35095347.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "farm-risk-management": [
    "https://images.pexels.com/photos/10150981/pexels-photo-10150981.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12248016/pexels-photo-12248016.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15048526/pexels-photo-15048526.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/129539/pexels-photo-129539.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17437550/pexels-photo-17437550.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8962190/pexels-photo-8962190.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9267931/pexels-photo-9267931.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33103445/pexels-photo-33103445.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "farm-work-schedule": [
    "https://images.pexels.com/photos/5990265/pexels-photo-5990265.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7580842/pexels-photo-7580842.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28891929/pexels-photo-28891929.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8866815/pexels-photo-8866815.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/3861970/pexels-photo-3861970.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7580853/pexels-photo-7580853.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/1181537/pexels-photo-1181537.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17724741/pexels-photo-17724741.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "quit-job-farming": [
    "https://images.pexels.com/photos/8279211/pexels-photo-8279211.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9301906/pexels-photo-9301906.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9301910/pexels-photo-9301910.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6120213/pexels-photo-6120213.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6489279/pexels-photo-6489279.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32064400/pexels-photo-32064400.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/30425501/pexels-photo-30425501.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11849619/pexels-photo-11849619.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "weekend-farm": [
    "https://images.pexels.com/photos/1023404/pexels-photo-1023404.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/14007005/pexels-photo-14007005.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/1023234/pexels-photo-1023234.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4894603/pexels-photo-4894603.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7658772/pexels-photo-7658772.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4971729/pexels-photo-4971729.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27176769/pexels-photo-27176769.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27670382/pexels-photo-27670382.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  // market/processing (found 8 of 16 published market articles mismatched on 2026-07-11)
  "banana-processing": [
    "https://images.pexels.com/photos/37646934/pexels-photo-37646934.jpeg?auto=compress&cs=tinysrgb&w=1400",
    // เพิ่ม pool 2026-07-11 (wave: market/mixed-farming/fishery)
    "https://images.pexels.com/photos/9191924/pexels-photo-9191924.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7263033/pexels-photo-7263033.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27508849/pexels-photo-27508849.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32280801/pexels-photo-32280801.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9832651/pexels-photo-9832651.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "chili-processing": [
    "https://images.pexels.com/photos/36362789/pexels-photo-36362789.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33588417/pexels-photo-33588417.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/221140/pexels-photo-221140.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/36606065/pexels-photo-36606065.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/38257989/pexels-photo-38257989.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35068971/pexels-photo-35068971.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "mango-processing": [
    "https://images.pexels.com/photos/37816783/pexels-photo-37816783.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4499212/pexels-photo-4499212.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/26151058/pexels-photo-26151058.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34112846/pexels-photo-34112846.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/26604409/pexels-photo-26604409.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35268684/pexels-photo-35268684.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "sell-eggs-community": [
    "https://images.pexels.com/photos/31037330/pexels-photo-31037330.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/29181504/pexels-photo-29181504.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/13029283/pexels-photo-13029283.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4042067/pexels-photo-4042067.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/20518741/pexels-photo-20518741.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/31558751/pexels-photo-31558751.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "sell-fruit-farmgate": [
    "https://images.pexels.com/photos/17885434/pexels-photo-17885434.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32189195/pexels-photo-32189195.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27691635/pexels-photo-27691635.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15922880/pexels-photo-15922880.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33329206/pexels-photo-33329206.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11669641/pexels-photo-11669641.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "facebook-line-farm-sales": [
    "https://images.pexels.com/photos/8939504/pexels-photo-8939504.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6994271/pexels-photo-6994271.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8939268/pexels-photo-8939268.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12519455/pexels-photo-12519455.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8939513/pexels-photo-8939513.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6868789/pexels-photo-6868789.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "herb-processing": [
    "https://images.pexels.com/photos/4834332/pexels-photo-4834332.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/10614247/pexels-photo-10614247.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6103379/pexels-photo-6103379.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11763581/pexels-photo-11763581.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6626976/pexels-photo-6626976.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34558849/pexels-photo-34558849.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "ready-to-cook-vegetables": [
    "https://images.pexels.com/photos/16563148/pexels-photo-16563148.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28670063/pexels-photo-28670063.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/30893267/pexels-photo-30893267.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33930755/pexels-photo-33930755.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/31087589/pexels-photo-31087589.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/30893251/pexels-photo-30893251.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  // เพิ่ม pool 2026-07-11 (wave: market/mixed-farming/fishery)
  "agri-pricing": [
    "https://images.pexels.com/photos/30893233/pexels-photo-30893233.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37957650/pexels-photo-37957650.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11831458/pexels-photo-11831458.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/262470/pexels-photo-262470.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8970688/pexels-photo-8970688.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6039897/pexels-photo-6039897.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "agri-product-standards": [
    "https://images.pexels.com/photos/13202066/pexels-photo-13202066.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17405756/pexels-photo-17405756.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6358834/pexels-photo-6358834.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7657392/pexels-photo-7657392.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33316026/pexels-photo-33316026.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32424228/pexels-photo-32424228.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "farm-branding": [
    "https://images.pexels.com/photos/37539930/pexels-photo-37539930.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/14609143/pexels-photo-14609143.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12070248/pexels-photo-12070248.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27509161/pexels-photo-27509161.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/29892493/pexels-photo-29892493.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37539928/pexels-photo-37539928.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "farmer-group-selling": [
    "https://images.pexels.com/photos/20527347/pexels-photo-20527347.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/13620347/pexels-photo-13620347.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/36384099/pexels-photo-36384099.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/20356942/pexels-photo-20356942.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12015190/pexels-photo-12015190.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6130170/pexels-photo-6130170.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "preorder-farm-products": [
    "https://images.pexels.com/photos/4451870/pexels-photo-4451870.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7657078/pexels-photo-7657078.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7657079/pexels-photo-7657079.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8248291/pexels-photo-8248291.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7657063/pexels-photo-7657063.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6994268/pexels-photo-6994268.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "price-drop-risk": [
    "https://images.pexels.com/photos/18392977/pexels-photo-18392977.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37009052/pexels-photo-37009052.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/701970/pexels-photo-701970.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33214228/pexels-photo-33214228.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9705830/pexels-photo-9705830.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/16950489/pexels-photo-16950489.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "sell-to-restaurants": [
    "https://images.pexels.com/photos/8629083/pexels-photo-8629083.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8093836/pexels-photo-8093836.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4252137/pexels-photo-4252137.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17584427/pexels-photo-17584427.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/29062078/pexels-photo-29062078.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6971732/pexels-photo-6971732.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "sell-vegetables-online": [
    "https://images.pexels.com/photos/8939510/pexels-photo-8939510.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8939267/pexels-photo-8939267.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8939505/pexels-photo-8939505.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8939261/pexels-photo-8939261.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/16052346/pexels-photo-16052346.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8939307/pexels-photo-8939307.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  // soil-water-fertilizer (found 20 of 22 published articles mismatched on 2026-07-11 — severe cross-shuffle between irrigation/soil/manure topics)
  // padded 2026-07-11: each cluster needs 6-7 unique covers to match published+draft demand (78 drafts across 15 clusters)
  "bio-fermented-liquid": [
    "https://images.pexels.com/photos/2786527/pexels-photo-2786527.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35105422/pexels-photo-35105422.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8260310/pexels-photo-8260310.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6872102/pexels-photo-6872102.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6872104/pexels-photo-6872104.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8257859/pexels-photo-8257859.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8257857/pexels-photo-8257857.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "clay-soil": [
    "https://images.pexels.com/photos/12103312/pexels-photo-12103312.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5739224/pexels-photo-5739224.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12940879/pexels-photo-12940879.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5950839/pexels-photo-5950839.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/216692/pexels-photo-216692.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/216693/pexels-photo-216693.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/1097016/pexels-photo-1097016.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  compost: [
    "https://images.pexels.com/photos/5503336/pexels-photo-5503336.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/29555030/pexels-photo-29555030.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32408464/pexels-photo-32408464.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/38319851/pexels-photo-38319851.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9861464/pexels-photo-9861464.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7728739/pexels-photo-7728739.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11573789/pexels-photo-11573789.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "drip-irrigation": [
    "https://images.pexels.com/photos/10606633/pexels-photo-10606633.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/29396001/pexels-photo-29396001.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7299933/pexels-photo-7299933.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27624218/pexels-photo-27624218.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/30839537/pexels-photo-30839537.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12532707/pexels-photo-12532707.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34182297/pexels-photo-34182297.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "green-manure": [
    "https://images.pexels.com/photos/29925665/pexels-photo-29925665.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28396511/pexels-photo-28396511.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/14776863/pexels-photo-14776863.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8268855/pexels-photo-8268855.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37385599/pexels-photo-37385599.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12529226/pexels-photo-12529226.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "manure-types": [
    "https://images.pexels.com/photos/31096626/pexels-photo-31096626.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15671396/pexels-photo-15671396.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15671402/pexels-photo-15671402.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/31110988/pexels-photo-31110988.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5793262/pexels-photo-5793262.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7245216/pexels-photo-7245216.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15600436/pexels-photo-15600436.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  mulching: [
    "https://images.pexels.com/photos/28310056/pexels-photo-28310056.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28310057/pexels-photo-28310057.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/36840017/pexels-photo-36840017.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9890699/pexels-photo-9890699.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/36836963/pexels-photo-36836963.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27509142/pexels-photo-27509142.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "npk-fertilizer": [
    "https://images.pexels.com/photos/25974981/pexels-photo-25974981.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15388818/pexels-photo-15388818.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/31673795/pexels-photo-31673795.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15388810/pexels-photo-15388810.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/20280085/pexels-photo-20280085.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/20280081/pexels-photo-20280081.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/26762732/pexels-photo-26762732.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "over-fertilizing": [
    "https://images.pexels.com/photos/36911967/pexels-photo-36911967.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/1145033/pexels-photo-1145033.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12903898/pexels-photo-12903898.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9968768/pexels-photo-9968768.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5661702/pexels-photo-5661702.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6204041/pexels-photo-6204041.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35726768/pexels-photo-35726768.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "problem-soil": [
    "https://images.pexels.com/photos/36767372/pexels-photo-36767372.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32831482/pexels-photo-32831482.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37609637/pexels-photo-37609637.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9903807/pexels-photo-9903807.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37655686/pexels-photo-37655686.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/36969414/pexels-photo-36969414.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7348668/pexels-photo-7348668.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "rainwater-harvesting": [
    "https://images.pexels.com/photos/13772681/pexels-photo-13772681.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/18312505/pexels-photo-18312505.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27566315/pexels-photo-27566315.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/13652079/pexels-photo-13652079.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/3715067/pexels-photo-3715067.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/529964/pexels-photo-529964.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "sandy-soil": [
    "https://images.pexels.com/photos/7501533/pexels-photo-7501533.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37710743/pexels-photo-37710743.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32938383/pexels-photo-32938383.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/18765260/pexels-photo-18765260.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/16694046/pexels-photo-16694046.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/19819163/pexels-photo-19819163.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37168026/pexels-photo-37168026.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "soil-test-ph": [
    "https://images.pexels.com/photos/17621449/pexels-photo-17621449.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/28965721/pexels-photo-28965721.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12413454/pexels-photo-12413454.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8851253/pexels-photo-8851253.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7944396/pexels-photo-7944396.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8392576/pexels-photo-8392576.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7223304/pexels-photo-7223304.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "sprinkler-fruit": [
    "https://images.pexels.com/photos/31231189/pexels-photo-31231189.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9886539/pexels-photo-9886539.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/29894790/pexels-photo-29894790.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9325560/pexels-photo-9325560.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17058054/pexels-photo-17058054.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27351043/pexels-photo-27351043.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "worm-compost": [
    "https://images.pexels.com/photos/3696170/pexels-photo-3696170.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4386491/pexels-photo-4386491.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33534747/pexels-photo-33534747.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/31416063/pexels-photo-31416063.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4386496/pexels-photo-4386496.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7670144/pexels-photo-7670144.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  // diseases (15 clusters, zero prior keyword-pool coverage on 2026-07-12 — all relying on generic CAT_IMAGE_POOLS["diseases"] fallback)
  "care-asf-pig": [
    "https://images.pexels.com/photos/13590647/pexels-photo-13590647.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34154075/pexels-photo-34154075.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/66627/pexels-photo-66627.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/31548254/pexels-photo-31548254.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6792159/pexels-photo-6792159.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15500453/pexels-photo-15500453.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "care-downy-mildew": [
    "https://images.pexels.com/photos/30438530/pexels-photo-30438530.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/36729977/pexels-photo-36729977.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/10479415/pexels-photo-10479415.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5978603/pexels-photo-5978603.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/29454154/pexels-photo-29454154.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12264567/pexels-photo-12264567.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37877335/pexels-photo-37877335.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "care-fish-water-shock": [
    "https://images.pexels.com/photos/5131195/pexels-photo-5131195.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32438533/pexels-photo-32438533.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35526523/pexels-photo-35526523.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32072434/pexels-photo-32072434.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/18733131/pexels-photo-18733131.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/19590004/pexels-photo-19590004.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "care-fmd-cattle": [
    "https://images.pexels.com/photos/16053487/pexels-photo-16053487.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27421346/pexels-photo-27421346.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/38198195/pexels-photo-38198195.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/38198202/pexels-photo-38198202.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37805782/pexels-photo-37805782.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/38117650/pexels-photo-38117650.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "care-frog-disease": [
    "https://images.pexels.com/photos/38369133/pexels-photo-38369133.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/10931687/pexels-photo-10931687.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/21327284/pexels-photo-21327284.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/36186244/pexels-photo-36186244.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/18453598/pexels-photo-18453598.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17868071/pexels-photo-17868071.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "care-golden-apple-snail-rice": [
    "https://images.pexels.com/photos/34965367/pexels-photo-34965367.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35782270/pexels-photo-35782270.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/14036284/pexels-photo-14036284.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/10345220/pexels-photo-10345220.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34620558/pexels-photo-34620558.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35782262/pexels-photo-35782262.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/30685509/pexels-photo-30685509.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "care-layer-chicken-diseases": [
    "https://images.pexels.com/photos/27685255/pexels-photo-27685255.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/29863325/pexels-photo-29863325.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/2255459/pexels-photo-2255459.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/13289167/pexels-photo-13289167.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/16733498/pexels-photo-16733498.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37541930/pexels-photo-37541930.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "care-leaf-blight": [
    "https://images.pexels.com/photos/11916385/pexels-photo-11916385.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27810913/pexels-photo-27810913.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34346427/pexels-photo-34346427.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/19200236/pexels-photo-19200236.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/19248484/pexels-photo-19248484.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15876350/pexels-photo-15876350.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/3968168/pexels-photo-3968168.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "care-leaf-miner": [
    "https://images.pexels.com/photos/34922948/pexels-photo-34922948.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8992138/pexels-photo-8992138.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5235967/pexels-photo-5235967.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/13695384/pexels-photo-13695384.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4113903/pexels-photo-4113903.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9779107/pexels-photo-9779107.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37552241/pexels-photo-37552241.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "care-mealybug": [
    "https://images.pexels.com/photos/5136274/pexels-photo-5136274.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/36833633/pexels-photo-36833633.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34784055/pexels-photo-34784055.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12388313/pexels-photo-12388313.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/38221168/pexels-photo-38221168.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32961689/pexels-photo-32961689.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/13214199/pexels-photo-13214199.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "care-root-rot": [
    "https://images.pexels.com/photos/13405008/pexels-photo-13405008.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5479034/pexels-photo-5479034.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9413758/pexels-photo-9413758.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/13543739/pexels-photo-13543739.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4202324/pexels-photo-4202324.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/9413788/pexels-photo-9413788.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6913442/pexels-photo-6913442.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "care-thrips": [
    "https://images.pexels.com/photos/7887002/pexels-photo-7887002.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/32700469/pexels-photo-32700469.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/20826378/pexels-photo-20826378.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/20797349/pexels-photo-20797349.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/24504145/pexels-photo-24504145.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/13541362/pexels-photo-13541362.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27585553/pexels-photo-27585553.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "care-weed-control": [
    "https://images.pexels.com/photos/20841301/pexels-photo-20841301.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17056280/pexels-photo-17056280.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/36848601/pexels-photo-36848601.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17765471/pexels-photo-17765471.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33325757/pexels-photo-33325757.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34641330/pexels-photo-34641330.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37218952/pexels-photo-37218952.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "care-whitefly": [
    "https://images.pexels.com/photos/28168759/pexels-photo-28168759.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/17190758/pexels-photo-17190758.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35101721/pexels-photo-35101721.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/30930182/pexels-photo-30930182.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/15725126/pexels-photo-15725126.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37453872/pexels-photo-37453872.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/35101720/pexels-photo-35101720.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "care-yellow-leaves": [
    "https://images.pexels.com/photos/16180524/pexels-photo-16180524.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5641295/pexels-photo-5641295.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5726026/pexels-photo-5726026.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/27959640/pexels-photo-27959640.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5750110/pexels-photo-5750110.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/12433710/pexels-photo-12433710.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/5726020/pexels-photo-5726020.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  // agri-tech-tools (found 17 of 18 published articles mismatched on 2026-07-11 — shared generic drone/finance stock pool, zero relevance logic)
  "agri-apps": [
    "https://images.pexels.com/photos/16678079/pexels-photo-16678079.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/4975400/pexels-photo-4975400.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/19134496/pexels-photo-19134496.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "agri-drone": [
    "https://images.pexels.com/photos/34182370/pexels-photo-34182370.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/34182367/pexels-photo-34182367.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/21364323/pexels-photo-21364323.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "battery-sprayer": [
    "https://images.pexels.com/photos/36027197/pexels-photo-36027197.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/10697911/pexels-photo-10697911.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/14944259/pexels-photo-14944259.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "farm-cctv": [
    "https://images.pexels.com/photos/15640038/pexels-photo-15640038.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/29866272/pexels-photo-29866272.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/37591149/pexels-photo-37591149.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "farm-google-sheets": [
    "https://images.pexels.com/photos/7821708/pexels-photo-7821708.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/8296981/pexels-photo-8296981.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6962993/pexels-photo-6962993.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "line-oa-farm": [
    "https://images.pexels.com/photos/8541349/pexels-photo-8541349.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/23939071/pexels-photo-23939071.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/7857532/pexels-photo-7857532.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "soil-moisture-sensor": [
    "https://images.pexels.com/photos/16905006/pexels-photo-16905006.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/21675714/pexels-photo-21675714.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/6792187/pexels-photo-6792187.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "solar-water-pump": [
    "https://images.pexels.com/photos/9799706/pexels-photo-9799706.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/38360727/pexels-photo-38360727.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/33813856/pexels-photo-33813856.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "vegetable-greenhouse": [
    "https://images.pexels.com/photos/36917505/pexels-photo-36917505.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/19581775/pexels-photo-19581775.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/20075896/pexels-photo-20075896.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
  "wood-chipper-farm": [
    "https://images.pexels.com/photos/34581908/pexels-photo-34581908.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/11124086/pexels-photo-11124086.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/31238872/pexels-photo-31238872.jpeg?auto=compress&cs=tinysrgb&w=1400",
  ],
};

function matchKeywordPool(slug: string): string[] | undefined {
  let bestKey: string | undefined;
  for (const key of Object.keys(KEYWORD_IMAGE_POOLS)) {
    if (slug.includes(key) && (!bestKey || key.length > bestKey.length)) bestKey = key;
  }
  return bestKey ? KEYWORD_IMAGE_POOLS[bestKey] : undefined;
}

// cost-profit slugs are matrix-generated (cost-profit-cost-845) and carry no crop/animal name —
// only the title does (e.g. "ต้นทุนเลี้ยงปลานิล"). Matched separately from KEYWORD_IMAGE_POOLS,
// gated to catSlug === "cost-profit" only, to avoid title-substring collisions bleeding into other categories.
const COST_PROFIT_TITLE_POOLS: Record<string, string[]> = {
  "ข้าวโพด": ["https://images.pexels.com/photos/6680152/pexels-photo-6680152.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/5454206/pexels-photo-5454206.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/6680154/pexels-photo-6680154.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/10221674/pexels-photo-10221674.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "ข้าว": ["https://images.pexels.com/photos/5214465/pexels-photo-5214465.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/36663339/pexels-photo-36663339.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/32200256/pexels-photo-32200256.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/35707025/pexels-photo-35707025.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "เกษตรผสมผสาน": ["https://images.pexels.com/photos/11798036/pexels-photo-11798036.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/12464355/pexels-photo-12464355.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/19851433/pexels-photo-19851433.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/37384648/pexels-photo-37384648.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "มันสำปะหลัง": ["https://images.pexels.com/photos/35109272/pexels-photo-35109272.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/36846177/pexels-photo-36846177.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/15897036/pexels-photo-15897036.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/7543161/pexels-photo-7543161.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "อ้อย": ["https://images.pexels.com/photos/9622985/pexels-photo-9622985.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/11942833/pexels-photo-11942833.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/27869189/pexels-photo-27869189.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/9622982/pexels-photo-9622982.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "ทุเรียน": ["https://images.pexels.com/photos/37385943/pexels-photo-37385943.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/17910529/pexels-photo-17910529.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/18068868/pexels-photo-18068868.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/17909867/pexels-photo-17909867.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "มะม่วง": ["https://images.pexels.com/photos/28903096/pexels-photo-28903096.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/11760088/pexels-photo-11760088.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/20987903/pexels-photo-20987903.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/36503371/pexels-photo-36503371.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "ผักสลัด": ["https://images.pexels.com/photos/37113938/pexels-photo-37113938.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/37371168/pexels-photo-37371168.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/15069693/pexels-photo-15069693.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/8018733/pexels-photo-8018733.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "พริก": ["https://images.pexels.com/photos/16532190/pexels-photo-16532190.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/10607852/pexels-photo-10607852.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/28704671/pexels-photo-28704671.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/10607851/pexels-photo-10607851.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "มะนาว": ["https://images.pexels.com/photos/34204205/pexels-photo-34204205.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/35445969/pexels-photo-35445969.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/35702580/pexels-photo-35702580.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/37752146/pexels-photo-37752146.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "เห็ดนางฟ้า": ["https://images.pexels.com/photos/31333813/pexels-photo-31333813.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/35992234/pexels-photo-35992234.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/31333814/pexels-photo-31333814.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/31243424/pexels-photo-31243424.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "ไก่ไข่": ["https://images.pexels.com/photos/37126259/pexels-photo-37126259.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/4911791/pexels-photo-4911791.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/4911710/pexels-photo-4911710.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/4200087/pexels-photo-4200087.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "ไก่บ้าน": ["https://images.pexels.com/photos/34278173/pexels-photo-34278173.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/11891477/pexels-photo-11891477.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/34795500/pexels-photo-34795500.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/12938033/pexels-photo-12938033.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "หมูขุน": ["https://images.pexels.com/photos/27167732/pexels-photo-27167732.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/2252541/pexels-photo-2252541.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/4956944/pexels-photo-4956944.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/15457826/pexels-photo-15457826.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "วัวเนื้อ": ["https://images.pexels.com/photos/10673160/pexels-photo-10673160.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/28962577/pexels-photo-28962577.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/7573234/pexels-photo-7573234.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/31158202/pexels-photo-31158202.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "แพะ": ["https://images.pexels.com/photos/34075170/pexels-photo-34075170.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/914300/pexels-photo-914300.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/28812843/pexels-photo-28812843.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/30032529/pexels-photo-30032529.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "ปลาดุก": ["https://images.pexels.com/photos/166633/pexels-photo-166633.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/19040476/pexels-photo-19040476.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/32243195/pexels-photo-32243195.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/37714627/pexels-photo-37714627.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "ปลานิล": ["https://images.pexels.com/photos/31636077/pexels-photo-31636077.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/8352786/pexels-photo-8352786.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/32262894/pexels-photo-32262894.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/36967886/pexels-photo-36967886.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "กบ": ["https://images.pexels.com/photos/12393834/pexels-photo-12393834.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/5798329/pexels-photo-5798329.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/38316937/pexels-photo-38316937.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/30443282/pexels-photo-30443282.jpeg?auto=compress&cs=tinysrgb&w=1400"],
  "สวนผลไม้": ["https://images.pexels.com/photos/3040712/pexels-photo-3040712.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/9891168/pexels-photo-9891168.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/31885070/pexels-photo-31885070.jpeg?auto=compress&cs=tinysrgb&w=1400", "https://images.pexels.com/photos/32343728/pexels-photo-32343728.jpeg?auto=compress&cs=tinysrgb&w=1400"],
};

function matchTitlePool(title: string): string[] | undefined {
  let bestKey: string | undefined;
  for (const key of Object.keys(COST_PROFIT_TITLE_POOLS)) {
    if (title.includes(key) && (!bestKey || key.length > bestKey.length)) bestKey = key;
  }
  return bestKey ? COST_PROFIT_TITLE_POOLS[bestKey] : undefined;
}

/** เลือกรูปจาก pool เฉพาะพันธุ์ก่อน (ถ้า slug ตรง) ไม่งั้น fallback ไป pool ของหมวด โดยข้ามรูปที่ถูกใช้แล้วในหมวดเดียวกัน (กันซ้ำ) */
async function coverFor(
  db: ReturnType<typeof createClient>,
  catSlug: string | undefined,
  slug: string,
  usedThisRun: Set<string>,
  title: string = "",
): Promise<string> {
  const pool =
    matchKeywordPool(slug) ||
    (catSlug === "cost-profit" ? matchTitlePool(title) : undefined) ||
    (catSlug ? CAT_IMAGE_POOLS[catSlug] : undefined);
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
        (await coverFor(db, row.catSlug as string | undefined, slug, usedThisRun, title));
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
