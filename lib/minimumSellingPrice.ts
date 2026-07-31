// ─────────────────────────────────────────────────────────────
// Pure calculation logic for /tools/minimum-selling-price.
// No React / DOM dependencies so this can be unit-tested directly.
// ─────────────────────────────────────────────────────────────

export type MSPInput = {
  rawMaterialCost: number;
  laborCost: number;
  waterCost: number;
  electricityCost: number;
  fertilizerFeedCost: number;
  equipmentCost: number;
  depreciation: number;
  packagingCost: number;
  shippingCost: number;
  platformFeePct: number; // ค่าธรรมเนียมแพลตฟอร์ม (%)
  totalYield: number; // ผลผลิตทั้งหมด (หน่วย)
  wasteAmount: number; // ของเสีย/ของเสียหาย (หน่วยเดียวกับผลผลิต)
  targetProfitPct: number; // กำไรเป้าหมาย (%) — คิดเป็น markup บนต้นทุนต่อหน่วย
};

export type MSPScenario = {
  label: string;
  costPerUnit: number;
  minPrice: number;
};

export type MSPResult = {
  totalCost: number;
  sellableYield: number;
  costPerUnit: number;
  /** ราคาขายขั้นต่ำที่ไม่ขาดทุน (หลังหักค่าธรรมเนียมแพลตฟอร์ม) */
  minPrice: number;
  /** ราคาขายที่ได้กำไรตามเป้าหมาย (หลังหักค่าธรรมเนียมแพลตฟอร์ม) */
  priceAtTargetProfit: number;
  profitPerUnit: number;
  breakEvenUnits: number;
  /** ราคาส่งตัวอย่าง (ไม่ใช่กฎตายตัว) */
  wholesalePrice: number;
  /** ราคาปลีกตัวอย่าง = ราคาที่ได้กำไรตามเป้าหมาย */
  retailPrice: number;
  scenarios: MSPScenario[];
  /** มีปัญหาที่ทำให้คำนวณต่อไม่ได้ (เช่น ของเสีย >= ผลผลิต หรือค่าธรรมเนียม >= 100%) */
  error?: string;
};

// ตัวอย่างส่วนลดราคาส่ง — เป็นเพียงตัวอย่างทั่วไป ไม่ใช่กฎตายตัว
const EXAMPLE_WHOLESALE_DISCOUNT_PCT = 12;

function sumCosts(input: MSPInput): number {
  return (
    input.rawMaterialCost +
    input.laborCost +
    input.waterCost +
    input.electricityCost +
    input.fertilizerFeedCost +
    input.equipmentCost +
    input.depreciation +
    input.packagingCost +
    input.shippingCost
  );
}

function buildScenario(
  label: string,
  totalCost: number,
  sellableYield: number,
  feeRatio: number,
): MSPScenario {
  const costPerUnit = sellableYield > 0 ? totalCost / sellableYield : 0;
  const minPrice = sellableYield > 0 ? costPerUnit / (1 - feeRatio) : 0;
  return { label, costPerUnit, minPrice };
}

export function calculateMinimumSellingPrice(input: MSPInput): MSPResult {
  const totalCost = sumCosts(input);
  const sellableYield = Math.max(0, input.totalYield - input.wasteAmount);

  const empty: Omit<MSPResult, "error"> = {
    totalCost,
    sellableYield: 0,
    costPerUnit: 0,
    minPrice: 0,
    priceAtTargetProfit: 0,
    profitPerUnit: 0,
    breakEvenUnits: 0,
    wholesalePrice: 0,
    retailPrice: 0,
    scenarios: [],
  };

  if (sellableYield <= 0) {
    return {
      ...empty,
      error:
        "ของเสีย/ของเสียหายมากกว่าหรือเท่ากับผลผลิตทั้งหมด ทำให้ไม่มีผลผลิตขายได้ กรุณาตรวจสอบตัวเลขผลผลิตและของเสียอีกครั้ง",
    };
  }

  if (input.platformFeePct >= 100) {
    return {
      ...empty,
      sellableYield,
      costPerUnit: totalCost / sellableYield,
      error: "ค่าธรรมเนียมแพลตฟอร์มต้องน้อยกว่า 100% กรุณาตรวจสอบตัวเลข",
    };
  }

  const costPerUnit = totalCost / sellableYield;
  const feeRatio = input.platformFeePct / 100;

  // ราคาขายขั้นต่ำ = ต้นทุนต่อหน่วย ÷ (1 - ค่าธรรมเนียมแพลตฟอร์ม%)
  // (ราคานี้ทำให้หลังหักค่าธรรมเนียมแล้ว ยังได้เงินคืนเท่ากับต้นทุนต่อหน่วยพอดี ไม่ขาดทุน)
  const minPrice = costPerUnit / (1 - feeRatio);

  // ราคาขายที่ได้กำไรตามเป้าหมาย
  //   = (ต้นทุนต่อหน่วย x (1 + กำไรเป้าหมาย%)) ÷ (1 - ค่าธรรมเนียมแพลตฟอร์ม%)
  // กำไรเป้าหมาย% ในที่นี้คิดเป็นเปอร์เซ็นต์ markup บนต้นทุนต่อหน่วย (ไม่ใช่ % ของราคาขาย)
  const targetProfitRatio = input.targetProfitPct / 100;
  const priceAtTargetProfit = (costPerUnit * (1 + targetProfitRatio)) / (1 - feeRatio);

  // เงินที่ได้จริงต่อหน่วยหลังหักค่าธรรมเนียมแพลตฟอร์ม
  const netReceivedPerUnit = priceAtTargetProfit * (1 - feeRatio);
  const profitPerUnit = netReceivedPerUnit - costPerUnit;

  // จุดคุ้มทุน = ต้นทุนรวม ÷ เงินที่ได้จริงต่อหน่วย (ที่ราคาขายตามเป้าหมายกำไร)
  const breakEvenUnits = netReceivedPerUnit > 0 ? totalCost / netReceivedPerUnit : 0;

  const wholesalePrice = priceAtTargetProfit * (1 - EXAMPLE_WHOLESALE_DISCOUNT_PCT / 100);
  const retailPrice = priceAtTargetProfit;

  const scenarios: MSPScenario[] = [
    buildScenario("ผลผลิตลดลง 10%", totalCost, sellableYield * 0.9, feeRatio),
    buildScenario("ผลผลิตลดลง 20%", totalCost, sellableYield * 0.8, feeRatio),
    buildScenario("ผลผลิตลดลง 30%", totalCost, sellableYield * 0.7, feeRatio),
    buildScenario("ต้นทุนเพิ่มขึ้น 10%", totalCost * 1.1, sellableYield, feeRatio),
    buildScenario("ต้นทุนเพิ่มขึ้น 20%", totalCost * 1.2, sellableYield, feeRatio),
  ];

  return {
    totalCost,
    sellableYield,
    costPerUnit,
    minPrice,
    priceAtTargetProfit,
    profitPerUnit,
    breakEvenUnits,
    wholesalePrice,
    retailPrice,
    scenarios,
  };
}
