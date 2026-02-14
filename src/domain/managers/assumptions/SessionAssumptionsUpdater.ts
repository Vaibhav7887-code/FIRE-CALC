import { BudgetSession } from "@/domain/models/BudgetSession";
import { RateBps } from "@/domain/models/RateBps";

export type AssumptionsDraft = Readonly<{
  taxYear: string;
  assumedInflationPercent: string;
  projectionHorizonYears: string;
}>;

export class SessionAssumptionsUpdater {
  public applyDraft(session: BudgetSession, draft: AssumptionsDraft): BudgetSession {
    const taxYear = this.clampInt(Number(draft.taxYear), 2000, 2100, session.locale.taxYear);
    const inflationPct = this.clampNumber(Number(draft.assumedInflationPercent), -50, 100, session.assumedAnnualInflation.toPercent());
    const horizonYears = this.clampInt(Number(draft.projectionHorizonYears), 1, 80, session.projectionHorizonYears);

    return {
      ...session,
      locale: { ...session.locale, taxYear },
      assumedAnnualInflation: RateBps.fromPercent(inflationPct),
      projectionHorizonYears: horizonYears,
    };
  }

  private clampInt(value: number, min: number, max: number, fallback: number): number {
    if (!Number.isFinite(value)) return fallback;
    const rounded = Math.round(value);
    return Math.min(max, Math.max(min, rounded));
  }

  private clampNumber(value: number, min: number, max: number, fallback: number): number {
    if (!Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, value));
  }
}

