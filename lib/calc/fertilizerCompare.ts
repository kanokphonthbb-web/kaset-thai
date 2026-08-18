// ─────────────────────────────────────────────────────────────
// Pure calculation logic for comparing fertilizer cost per nutrient unit.
// No React / DOM dependencies so this can be unit-tested directly.
// ─────────────────────────────────────────────────────────────

export type FertilizerCompareItem = {
  name: string;
  n: number;
  p: number;
  k: number;
  bagWeightKg: number;
  bagPrice: number;
};

export type FertilizerCompareResult = {
  name: string;
  costPerKgFertilizer: number | null;
  costPerKgN: number | null;
  costPerKgP2O5: number | null;
  costPerKgK2O: number | null;
};

/**
 * เปรียบเทียบต้นทุนปุ๋ยแต่ละยี่ห้อ/สูตร ต่อกิโลกรัมของปุ๋ยและต่อกิโลกรัมของธาตุอาหารแต่ละตัว
 *
 * หมายเหตุสำคัญ: เปรียบเทียบต้นทุนต่อธาตุอาหารเท่านั้น ไม่ตัดสินว่าสูตรไหน "ดีกว่า"
 * (ปุ๋ยแต่ละสูตรเหมาะกับพืชและช่วงเวลาต่างกัน)
 */
export function compareFertilizers(
  items: FertilizerCompareItem[]
): FertilizerCompareResult[] {
  return items.map((item) => {
    const { name, n, p, k, bagWeightKg, bagPrice } = item;

    for (const [key, value] of Object.entries({ n, p, k })) {
      if (value < 0 || value > 100) {
        throw new RangeError(`Invalid nutrient percentage for ${key}: ${value} (must be 0-100)`);
      }
    }

    const costPerKgFertilizer = bagWeightKg > 0 ? bagPrice / bagWeightKg : null;

    const nKgPerBag = bagWeightKg * (n / 100);
    const p2o5KgPerBag = bagWeightKg * (p / 100);
    const k2oKgPerBag = bagWeightKg * (k / 100);

    const costPerKgN = nKgPerBag > 0 ? bagPrice / nKgPerBag : null;
    const costPerKgP2O5 = p2o5KgPerBag > 0 ? bagPrice / p2o5KgPerBag : null;
    const costPerKgK2O = k2oKgPerBag > 0 ? bagPrice / k2oKgPerBag : null;

    return {
      name,
      costPerKgFertilizer,
      costPerKgN,
      costPerKgP2O5,
      costPerKgK2O,
    };
  });
}
