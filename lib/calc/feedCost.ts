// ─────────────────────────────────────────────────────────────
// Pure calculation logic for livestock feed cost planning.
// No React / DOM dependencies so this can be unit-tested directly.
// ─────────────────────────────────────────────────────────────

export type FeedCostInput = {
  animals: number;
  feedKgPerAnimalPerDay: number;
  feedPricePerKg: number;
  days: number;
};

export type FeedCostResult = {
  feedKgPerDay: number;
  feedKgTotal: number;
  totalCost: number;
  /** ต้นทุนต่อตัว — null ถ้าจำนวนสัตว์ <= 0 */
  costPerAnimal: number | null;
};

/**
 * คำนวณต้นทุนอาหารสัตว์รวม จากจำนวนสัตว์ อัตราการกินต่อวัน ราคาอาหาร และจำนวนวัน
 */
export function computeFeedCost(input: FeedCostInput): FeedCostResult {
  const { animals, feedKgPerAnimalPerDay, feedPricePerKg, days } = input;

  const feedKgPerDay = animals * feedKgPerAnimalPerDay;
  const feedKgTotal = feedKgPerDay * days;
  const totalCost = feedKgTotal * feedPricePerKg;
  const costPerAnimal = animals > 0 ? totalCost / animals : null;

  return { feedKgPerDay, feedKgTotal, totalCost, costPerAnimal };
}
