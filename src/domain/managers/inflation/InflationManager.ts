import { Money } from "@/domain/models/Money";
import { RateBps } from "@/domain/models/RateBps";

export type InflationAdjustedPoint = Readonly<{
  monthIndex: number;
  nominal: Money;
  real: Money;
}>;

export class InflationManager {
  public adjustMonthlySeriesToReal(
    points: ReadonlyArray<{ monthIndex: number; totalValue: Money }>,
    assumedAnnualInflation: RateBps,
  ): ReadonlyArray<InflationAdjustedPoint> {
    const inflationMonthly = this.annualToMonthlyRate(assumedAnnualInflation.toDecimal());

    return points.map((p) => {
      const discountFactor = Math.pow(1 + inflationMonthly, p.monthIndex);
      const realCents = Math.round(p.totalValue.getCents() / discountFactor);
      return {
        monthIndex: p.monthIndex,
        nominal: p.totalValue,
        real: Money.fromCents(realCents),
      };
    });
  }

  private annualToMonthlyRate(annualDecimal: number): number {
    if (!Number.isFinite(annualDecimal)) return 0;
    return annualDecimal / 12;
  }
}

