import { InfillLevel } from '../models/api.models';

/**
 * Orientational pricing model used by the instant estimator.
 * Pure functions — no Angular dependencies — so the logic is easy to test
 * and to tune per client.
 */

export interface InfillOption {
  readonly value: InfillLevel;
  readonly percent: number;
  readonly label: string;
  readonly hint: string;
  /** Material & machine-time multiplier relative to the standard 20 % infill. */
  readonly factor: number;
}

export const INFILL_OPTIONS: readonly InfillOption[] = [
  { value: 'standard', percent: 20, label: 'Štandard', hint: 'Prototypy a kryty', factor: 1 },
  { value: 'reinforced', percent: 50, label: 'Zosilnený diel', hint: 'Funkčné a nosné diely', factor: 1.35 },
  { value: 'solid', percent: 100, label: 'Plný materiál', hint: 'Max. pevnosť a tuhosť', factor: 1.9 },
];

export interface BatchTier {
  readonly minQty: number;
  readonly discount: number;
}

/** Tiered batch discounts: -10 % from 10 pcs, -20 % from 50, -30 % from 100. */
export const BATCH_TIERS: readonly BatchTier[] = [
  { minQty: 100, discount: 0.3 },
  { minQty: 50, discount: 0.2 },
  { minQty: 10, discount: 0.1 },
];

export const SIZE_PRESETS = [
  { label: 'Malý diel', grams: 25 },
  { label: 'Stredný držiak / kryt', grams: 120 },
  { label: 'Veľký prototyp', grams: 450 },
] as const;

export const WEIGHT_RANGE = { min: 10, max: 1000, step: 5 } as const;
export const QTY_RANGE = { min: 1, max: 500 } as const;

/** Base lead time (working days) and daily throughput per technology. */
const PRODUCTION_PROFILE: Record<string, { baseDays: number; gramsPerDay: number }> = {
  fdm: { baseDays: 2, gramsPerDay: 3000 },
  sla: { baseDays: 2, gramsPerDay: 1500 },
  sls: { baseDays: 4, gramsPerDay: 5000 },
};
const DEFAULT_PROFILE = { baseDays: 3, gramsPerDay: 2500 };

export interface EstimateInput {
  pricePerGram: number;
  setupFee: number;
  grams: number;
  infill: InfillLevel;
  quantity: number;
  technologySlug: string;
}

export interface Estimate {
  pricePerPiece: number;
  totalPrice: number;
  listPrice: number;
  discountRate: number;
  savings: number;
  setupFee: number;
  materialGrams: number;
  leadTimeMin: number;
  leadTimeMax: number;
  isExpress: boolean;
  nextTier: { minQty: number; discount: number } | null;
}

export function discountFor(quantity: number): number {
  return BATCH_TIERS.find((tier) => quantity >= tier.minQty)?.discount ?? 0;
}

export function nextTierFor(quantity: number): BatchTier | null {
  const upcoming = [...BATCH_TIERS].reverse().find((tier) => quantity < tier.minQty);
  return upcoming ?? null;
}

export function infillFactor(infill: InfillLevel): number {
  return INFILL_OPTIONS.find((o) => o.value === infill)?.factor ?? 1;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function estimate(input: EstimateInput): Estimate {
  const quantity = Math.max(1, Math.round(input.quantity));
  const factor = infillFactor(input.infill);
  const gramsPerPiece = input.grams * factor;
  const piecePrice = gramsPerPiece * input.pricePerGram;
  const discountRate = discountFor(quantity);

  const listPrice = piecePrice * quantity + input.setupFee;
  const totalPrice = piecePrice * quantity * (1 - discountRate) + input.setupFee;

  const profile = PRODUCTION_PROFILE[input.technologySlug] ?? DEFAULT_PROFILE;
  const totalGrams = gramsPerPiece * quantity;
  const extraDays = Math.max(0, Math.ceil(totalGrams / profile.gramsPerDay) - 1);
  const leadTimeMin = profile.baseDays + extraDays;
  const leadTimeMax = leadTimeMin + (quantity >= 50 ? 2 : 1);

  return {
    pricePerPiece: round2(totalPrice / quantity),
    totalPrice: round2(totalPrice),
    listPrice: round2(listPrice),
    discountRate,
    savings: round2(listPrice - totalPrice),
    setupFee: input.setupFee,
    materialGrams: Math.round(totalGrams),
    leadTimeMin,
    leadTimeMax,
    isExpress: leadTimeMin <= 2,
    nextTier: nextTierFor(quantity),
  };
}

/** Slovak plural for working days: 1 deň, 2–4 dni, 5+ dní. */
export function workingDaysLabel(n: number): string {
  if (n === 1) return 'pracovný deň';
  if (n >= 2 && n <= 4) return 'pracovné dni';
  return 'pracovných dní';
}
