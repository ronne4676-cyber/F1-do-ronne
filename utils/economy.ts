
import { UPGRADES, INITIAL_CAR_STATS } from '../constants';
import { CarStats } from '../types';

/**
 * Calculates the next upgrade cost for a specific car statistic.
 * Uses exponential growth to simulate the increasing difficulty of high-level F1 development.
 * 
 * @param stat - The car statistic to upgrade
 * @param currentVal - The current value of that statistic
 * @returns The calculated R&D cost as an integer
 */
export const calculateUpgradeCost = (
  stat: keyof CarStats,
  currentVal: number
): number => {
  // 1. Type-safe configuration access
  const config = UPGRADES[stat];
  
  if (!config) {
    console.error(`[Economy] Critical: Stat "${stat}" not found in UPGRADES configuration.`);
    return 0;
  }

  // 2. Validate numeric integrity of the current value
  if (typeof currentVal !== 'number' || !Number.isFinite(currentVal)) {
    console.warn(`[Economy] Warning: Received non-finite value (${currentVal}) for stat "${stat}". Using base cost.`);
    return config.baseCost;
  }

  const initialVal = INITIAL_CAR_STATS[stat];
  
  // 3. Safety check for configuration increments to prevent division by zero or infinite loops
  if (typeof config.increment !== 'number' || config.increment <= 0) {
    console.error(`[Economy] Configuration Error: Stat "${stat}" has an invalid increment of ${config.increment}.`);
    return config.baseCost;
  }

  /**
   * 4. Calculate progression level
   * We determine how many "steps" have been taken since the baseline.
   * We use Math.max(0, ...) to ensure we don't return negative levels if stats were manually lowered.
   */
  const levels = Math.max(0, Math.floor((currentVal - initialVal) / config.increment));

  /**
   * 5. Exponential Cost Formula: BaseCost * (Multiplier ^ Level)
   * This ensures that pushing for that last 1% of performance is significantly more expensive 
   * than early-season gains.
   */
  try {
    const cost = config.baseCost * Math.pow(config.costMultiplier, levels);

    // 6. Handle potential overflow or calculation anomalies
    if (!Number.isFinite(cost) || cost < 0) {
      throw new Error("Calculation result is not a valid finite positive number");
    }

    return Math.floor(cost);
  } catch (err) {
    console.error(`[Economy] Calculation overflow for ${stat} at level ${levels}. Returning base cost.`, err);
    return config.baseCost;
  }
};

/**
 * Formats a currency value into a human-readable F1 shorthand (e.g., $15.5M).
 * 
 * @param amount - The numeric value in dollars
 * @returns A formatted string
 */
export const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return "$0";
  
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (absAmount >= 1_000_000) {
    return `${sign}$${(absAmount / 1_000_000).toFixed(1)}M`;
  }
  if (absAmount >= 1_000) {
    return `${sign}$${(absAmount / 1_000).toFixed(0)}K`;
  }
  return `${sign}$${absAmount.toLocaleString()}`;
};
