// พิกัดตัวเมือง/ศาลากลาง 77 จังหวัด (ทศนิยม 2 ตำแหน่ง ~1 กม.)
// ใช้เป็นจุดอ้างอิงยิง TMD nwpapi (/at endpoint) — โมเดล TMD จะ snap เข้ากริดเองอยู่แล้ว
// จึงยอมรับความคลาดเคลื่อนระดับตัวเมืองได้ ไม่ใช่พิกัดนำทาง

export type ThaiRegion = "north" | "northeast" | "central" | "east" | "west" | "south";

export const REGION_LABEL_TH: Record<ThaiRegion, string> = {
  north: "ภาคเหนือ",
  northeast: "ภาคตะวันออกเฉียงเหนือ",
  central: "ภาคกลาง",
  east: "ภาคตะวันออก",
  west: "ภาคตะวันตก",
  south: "ภาคใต้",
};

export interface ProvinceLocation {
  slug: string;
  nameTh: string;
  region: ThaiRegion;
  lat: number;
  lon: number;
}

export const PROVINCES: ProvinceLocation[] = [
  // ── ภาคเหนือ ──
  { slug: "chiang-rai", nameTh: "เชียงราย", region: "north", lat: 19.91, lon: 99.83 },
  { slug: "chiang-mai", nameTh: "เชียงใหม่", region: "north", lat: 18.79, lon: 98.98 },
  { slug: "nan", nameTh: "น่าน", region: "north", lat: 18.78, lon: 100.77 },
  { slug: "phayao", nameTh: "พะเยา", region: "north", lat: 19.17, lon: 99.9 },
  { slug: "phrae", nameTh: "แพร่", region: "north", lat: 18.14, lon: 100.14 },
  { slug: "mae-hong-son", nameTh: "แม่ฮ่องสอน", region: "north", lat: 19.3, lon: 97.97 },
  { slug: "lampang", nameTh: "ลำปาง", region: "north", lat: 18.29, lon: 99.49 },
  { slug: "lamphun", nameTh: "ลำพูน", region: "north", lat: 18.58, lon: 99.01 },
  { slug: "uttaradit", nameTh: "อุตรดิตถ์", region: "north", lat: 17.62, lon: 100.1 },
  // ── ภาคตะวันออกเฉียงเหนือ ──
  { slug: "kalasin", nameTh: "กาฬสินธุ์", region: "northeast", lat: 16.43, lon: 103.51 },
  { slug: "khon-kaen", nameTh: "ขอนแก่น", region: "northeast", lat: 16.44, lon: 102.84 },
  { slug: "chaiyaphum", nameTh: "ชัยภูมิ", region: "northeast", lat: 15.81, lon: 102.03 },
  { slug: "nakhon-phanom", nameTh: "นครพนม", region: "northeast", lat: 17.39, lon: 104.77 },
  { slug: "nakhon-ratchasima", nameTh: "นครราชสีมา", region: "northeast", lat: 14.98, lon: 102.1 },
  { slug: "bueng-kan", nameTh: "บึงกาฬ", region: "northeast", lat: 18.36, lon: 103.65 },
  { slug: "buriram", nameTh: "บุรีรัมย์", region: "northeast", lat: 14.99, lon: 103.1 },
  { slug: "maha-sarakham", nameTh: "มหาสารคาม", region: "northeast", lat: 16.18, lon: 103.3 },
  { slug: "mukdahan", nameTh: "มุกดาหาร", region: "northeast", lat: 16.54, lon: 104.72 },
  { slug: "yasothon", nameTh: "ยโสธร", region: "northeast", lat: 15.79, lon: 104.15 },
  { slug: "roi-et", nameTh: "ร้อยเอ็ด", region: "northeast", lat: 16.05, lon: 103.65 },
  { slug: "loei", nameTh: "เลย", region: "northeast", lat: 17.49, lon: 101.72 },
  { slug: "si-sa-ket", nameTh: "ศรีสะเกษ", region: "northeast", lat: 15.12, lon: 104.32 },
  { slug: "sakon-nakhon", nameTh: "สกลนคร", region: "northeast", lat: 17.16, lon: 104.15 },
  { slug: "surin", nameTh: "สุรินทร์", region: "northeast", lat: 14.88, lon: 103.49 },
  { slug: "nong-khai", nameTh: "หนองคาย", region: "northeast", lat: 17.88, lon: 102.74 },
  { slug: "nong-bua-lamphu", nameTh: "หนองบัวลำภู", region: "northeast", lat: 17.2, lon: 102.44 },
  { slug: "amnat-charoen", nameTh: "อำนาจเจริญ", region: "northeast", lat: 15.86, lon: 104.63 },
  { slug: "udon-thani", nameTh: "อุดรธานี", region: "northeast", lat: 17.41, lon: 102.79 },
  { slug: "ubon-ratchathani", nameTh: "อุบลราชธานี", region: "northeast", lat: 15.24, lon: 104.85 },
  // ── ภาคกลาง ──
  { slug: "bangkok", nameTh: "กรุงเทพมหานคร", region: "central", lat: 13.75, lon: 100.5 },
  { slug: "kamphaeng-phet", nameTh: "กำแพงเพชร", region: "central", lat: 16.48, lon: 99.52 },
  { slug: "chai-nat", nameTh: "ชัยนาท", region: "central", lat: 15.19, lon: 100.13 },
  { slug: "nakhon-nayok", nameTh: "นครนายก", region: "central", lat: 14.2, lon: 101.21 },
  { slug: "nakhon-pathom", nameTh: "นครปฐม", region: "central", lat: 13.82, lon: 100.06 },
  { slug: "nakhon-sawan", nameTh: "นครสวรรค์", region: "central", lat: 15.7, lon: 100.14 },
  { slug: "nonthaburi", nameTh: "นนทบุรี", region: "central", lat: 13.86, lon: 100.51 },
  { slug: "pathum-thani", nameTh: "ปทุมธานี", region: "central", lat: 14.02, lon: 100.53 },
  { slug: "ayutthaya", nameTh: "พระนครศรีอยุธยา", region: "central", lat: 14.35, lon: 100.57 },
  { slug: "phichit", nameTh: "พิจิตร", region: "central", lat: 16.44, lon: 100.35 },
  { slug: "phitsanulok", nameTh: "พิษณุโลก", region: "central", lat: 16.82, lon: 100.27 },
  { slug: "phetchabun", nameTh: "เพชรบูรณ์", region: "central", lat: 16.42, lon: 101.16 },
  { slug: "lopburi", nameTh: "ลพบุรี", region: "central", lat: 14.8, lon: 100.62 },
  { slug: "samut-prakan", nameTh: "สมุทรปราการ", region: "central", lat: 13.6, lon: 100.6 },
  { slug: "samut-songkhram", nameTh: "สมุทรสงคราม", region: "central", lat: 13.41, lon: 100.0 },
  { slug: "samut-sakhon", nameTh: "สมุทรสาคร", region: "central", lat: 13.55, lon: 100.27 },
  { slug: "saraburi", nameTh: "สระบุรี", region: "central", lat: 14.53, lon: 100.91 },
  { slug: "sing-buri", nameTh: "สิงห์บุรี", region: "central", lat: 14.89, lon: 100.4 },
  { slug: "sukhothai", nameTh: "สุโขทัย", region: "central", lat: 17.01, lon: 99.82 },
  { slug: "suphan-buri", nameTh: "สุพรรณบุรี", region: "central", lat: 14.47, lon: 100.12 },
  { slug: "ang-thong", nameTh: "อ่างทอง", region: "central", lat: 14.59, lon: 100.46 },
  { slug: "uthai-thani", nameTh: "อุทัยธานี", region: "central", lat: 15.38, lon: 100.02 },
  // ── ภาคตะวันออก ──
  { slug: "chanthaburi", nameTh: "จันทบุรี", region: "east", lat: 12.61, lon: 102.1 },
  { slug: "chachoengsao", nameTh: "ฉะเชิงเทรา", region: "east", lat: 13.69, lon: 101.07 },
  { slug: "chonburi", nameTh: "ชลบุรี", region: "east", lat: 13.36, lon: 100.98 },
  { slug: "trat", nameTh: "ตราด", region: "east", lat: 12.24, lon: 102.51 },
  { slug: "prachinburi", nameTh: "ปราจีนบุรี", region: "east", lat: 14.05, lon: 101.37 },
  { slug: "rayong", nameTh: "ระยอง", region: "east", lat: 12.68, lon: 101.28 },
  { slug: "sa-kaeo", nameTh: "สระแก้ว", region: "east", lat: 13.82, lon: 102.07 },
  // ── ภาคตะวันตก ──
  { slug: "kanchanaburi", nameTh: "กาญจนบุรี", region: "west", lat: 14.02, lon: 99.53 },
  { slug: "tak", nameTh: "ตาก", region: "west", lat: 16.88, lon: 99.13 },
  { slug: "prachuap-khiri-khan", nameTh: "ประจวบคีรีขันธ์", region: "west", lat: 11.81, lon: 99.8 },
  { slug: "phetchaburi", nameTh: "เพชรบุรี", region: "west", lat: 13.11, lon: 99.94 },
  { slug: "ratchaburi", nameTh: "ราชบุรี", region: "west", lat: 13.53, lon: 99.81 },
  // ── ภาคใต้ ──
  { slug: "krabi", nameTh: "กระบี่", region: "south", lat: 8.09, lon: 98.91 },
  { slug: "chumphon", nameTh: "ชุมพร", region: "south", lat: 10.49, lon: 99.18 },
  { slug: "trang", nameTh: "ตรัง", region: "south", lat: 7.56, lon: 99.61 },
  { slug: "nakhon-si-thammarat", nameTh: "นครศรีธรรมราช", region: "south", lat: 8.43, lon: 99.96 },
  { slug: "narathiwat", nameTh: "นราธิวาส", region: "south", lat: 6.43, lon: 101.82 },
  { slug: "pattani", nameTh: "ปัตตานี", region: "south", lat: 6.87, lon: 101.25 },
  { slug: "phang-nga", nameTh: "พังงา", region: "south", lat: 8.45, lon: 98.53 },
  { slug: "phatthalung", nameTh: "พัทลุง", region: "south", lat: 7.62, lon: 100.07 },
  { slug: "phuket", nameTh: "ภูเก็ต", region: "south", lat: 7.88, lon: 98.39 },
  { slug: "yala", nameTh: "ยะลา", region: "south", lat: 6.54, lon: 101.28 },
  { slug: "ranong", nameTh: "ระนอง", region: "south", lat: 9.97, lon: 98.63 },
  { slug: "songkhla", nameTh: "สงขลา", region: "south", lat: 7.19, lon: 100.6 },
  { slug: "satun", nameTh: "สตูล", region: "south", lat: 6.62, lon: 100.07 },
  { slug: "surat-thani", nameTh: "สุราษฎร์ธานี", region: "south", lat: 9.14, lon: 99.33 },
];

const BY_SLUG = new Map(PROVINCES.map((p) => [p.slug, p]));

export function findProvinceBySlug(slug: string): ProvinceLocation | null {
  return BY_SLUG.get(slug) ?? null;
}

export function provincesByRegion(): Array<{ region: ThaiRegion; labelTh: string; provinces: ProvinceLocation[] }> {
  const order: ThaiRegion[] = ["north", "northeast", "central", "east", "west", "south"];
  return order.map((region) => ({
    region,
    labelTh: REGION_LABEL_TH[region],
    provinces: PROVINCES.filter((p) => p.region === region).sort((a, b) =>
      a.nameTh.localeCompare(b.nameTh, "th"),
    ),
  }));
}
