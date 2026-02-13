import { BasicPersonalAmountConfig, TaxBracket, TaxReductionConfig } from "@/domain/managers/tax/TaxTableTypes";

export class TaxMath {
  public static clampNonNegative(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, value);
  }

  public static calculateBracketTax(
    taxableIncome: number,
    brackets: ReadonlyArray<TaxBracket>,
  ): number {
    const income = TaxMath.clampNonNegative(taxableIncome);
    const bracket = TaxMath.findBracket(income, brackets);
    // Using CRA "R * income - K" style constants.
    return TaxMath.clampNonNegative(bracket.rate * income - bracket.constant);
  }

  public static calculateFederalBasicPersonalAmount(
    taxableIncome: number,
    config: BasicPersonalAmountConfig,
  ): number {
    const income = TaxMath.clampNonNegative(taxableIncome);

    if (income <= config.phaseOut.startInclusive) return config.maxAmount;
    if (income >= config.phaseOut.endInclusive) return config.minAmount;

    const range = config.phaseOut.endInclusive - config.phaseOut.startInclusive;
    const t = (income - config.phaseOut.startInclusive) / range;
    return config.maxAmount - t * (config.maxAmount - config.minAmount);
  }

  public static calculateBcTaxReduction(income: number, config: TaxReductionConfig): number {
    const taxable = TaxMath.clampNonNegative(income);

    if (taxable <= config.fullReductionMaxIncome) return config.maxReduction;
    if (taxable >= config.phaseOutEndIncome) return 0;

    const excess = taxable - config.fullReductionMaxIncome;
    const reduction = config.maxReduction - config.phaseOutRate * excess;
    return TaxMath.clampNonNegative(reduction);
  }

  private static findBracket(income: number, brackets: ReadonlyArray<TaxBracket>): TaxBracket {
    for (const b of brackets) {
      const withinLower = income >= b.fromInclusive;
      const withinUpper = b.toInclusive === null ? true : income <= b.toInclusive;
      if (withinLower && withinUpper) return b;
    }
    return brackets[0]!;
  }
}

