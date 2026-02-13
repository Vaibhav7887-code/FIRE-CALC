import { describe, expect, it } from "vitest";
import { TaxEngineManager } from "@/domain/managers/tax/TaxEngineManager";
import { TaxYearConfigProvider } from "@/domain/managers/tax/TaxYearConfigProvider";
import { caBcTaxYear2026 } from "@/config/tax/ca-bc-2026";
import { Money } from "@/domain/models/Money";

describe("TaxEngineManager (CA/BC 2026)", () => {
  it("returns non-negative net income and deductions", () => {
    const engine = new TaxEngineManager(new TaxYearConfigProvider([caBcTaxYear2026]));
    const result = engine.estimate({
      taxYear: 2026,
      grossHouseholdIncomeAnnual: Money.fromDollars(100000),
      rrspContributionAnnual: Money.fromDollars(0),
      rrspContributionRoomAnnual: Money.fromDollars(30000),
    });

    expect(result.netIncomeAnnual.getCents()).toBeGreaterThan(0);
    expect(result.federalTaxAnnual.getCents()).toBeGreaterThanOrEqual(0);
    expect(result.provincialTaxAnnual.getCents()).toBeGreaterThanOrEqual(0);
    expect(result.cppAnnual.getCents()).toBeGreaterThanOrEqual(0);
    expect(result.eiAnnual.getCents()).toBeGreaterThanOrEqual(0);
  });

  it("RRSP contributions reduce taxable income (up to room)", () => {
    const engine = new TaxEngineManager(new TaxYearConfigProvider([caBcTaxYear2026]));

    const noRrsp = engine.estimate({
      taxYear: 2026,
      grossHouseholdIncomeAnnual: Money.fromDollars(120000),
      rrspContributionAnnual: Money.fromDollars(0),
      rrspContributionRoomAnnual: Money.fromDollars(20000),
    });

    const withRrsp = engine.estimate({
      taxYear: 2026,
      grossHouseholdIncomeAnnual: Money.fromDollars(120000),
      rrspContributionAnnual: Money.fromDollars(30000),
      rrspContributionRoomAnnual: Money.fromDollars(20000),
    });

    expect(withRrsp.taxableIncomeAnnual.getCents()).toBeLessThan(noRrsp.taxableIncomeAnnual.getCents());
    expect(withRrsp.rrspDeductionAnnual.getCents()).toBe(Money.fromDollars(20000).getCents());
  });
});

