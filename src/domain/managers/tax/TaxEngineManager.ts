import { Money } from "@/domain/models/Money";
import { TaxMath } from "@/domain/managers/tax/TaxMath";
import { TaxYearConfigProvider } from "@/domain/managers/tax/TaxYearConfigProvider";

export type TaxEngineInput = Readonly<{
  taxYear: number;
  grossHouseholdIncomeAnnual: Money;
  rrspContributionAnnual: Money;
  rrspContributionRoomAnnual: Money | null;
}>;

export type TaxEngineResult = Readonly<{
  taxableIncomeAnnual: Money;
  rrspDeductionAnnual: Money;
  federalTaxAnnual: Money;
  provincialTaxAnnual: Money;
  cppAnnual: Money;
  eiAnnual: Money;
  netIncomeAnnual: Money;
  netIncomeMonthly: Money;
}>;

export class TaxEngineManager {
  private readonly configProvider: TaxYearConfigProvider;

  public constructor(configProvider: TaxYearConfigProvider = new TaxYearConfigProvider()) {
    this.configProvider = configProvider;
  }

  public estimate(input: TaxEngineInput): TaxEngineResult {
    const config = this.configProvider.getOrFallback(input.taxYear);

    const grossAnnual = Math.max(0, input.grossHouseholdIncomeAnnual.getCents() / 100);

    const rrspAnnualRequested = Math.max(0, input.rrspContributionAnnual.getCents() / 100);
    const rrspRoom = input.rrspContributionRoomAnnual
      ? Math.max(0, input.rrspContributionRoomAnnual.getCents() / 100)
      : rrspAnnualRequested;
    const rrspDeduction = Math.min(rrspAnnualRequested, rrspRoom);

    const taxableIncome = Math.max(0, grossAnnual - rrspDeduction);

    const federalBaseTax = TaxMath.calculateBracketTax(taxableIncome, config.federal.brackets);
    const federalBpa = TaxMath.calculateFederalBasicPersonalAmount(
      taxableIncome,
      config.federal.basicPersonalAmount,
    );
    const federalBpaCredit = federalBpa * config.federal.lowestRate;
    const employmentAmount = Math.min(config.federal.employmentAmountMax, grossAnnual);
    const employmentCredit = employmentAmount * config.federal.lowestRate;

    const federalTax = TaxMath.clampNonNegative(federalBaseTax - federalBpaCredit - employmentCredit);

    const bcBaseTax = TaxMath.calculateBracketTax(taxableIncome, config.bc.brackets);
    const bcBpaCredit = config.bc.basicPersonalAmount * config.bc.lowestRate;
    const bcReduction = TaxMath.calculateBcTaxReduction(taxableIncome, config.bc.taxReduction);
    const bcTax = TaxMath.clampNonNegative(bcBaseTax - bcBpaCredit - bcReduction);

    const cpp = this.calculateCppEmployeeAnnual(grossAnnual, config.payroll.cpp);
    const ei = this.calculateEiEmployeeAnnual(grossAnnual, config.payroll.ei);

    const netAnnual = Math.max(0, grossAnnual - federalTax - bcTax - cpp - ei);

    return {
      taxableIncomeAnnual: Money.fromDollars(taxableIncome),
      rrspDeductionAnnual: Money.fromDollars(rrspDeduction),
      federalTaxAnnual: Money.fromDollars(federalTax),
      provincialTaxAnnual: Money.fromDollars(bcTax),
      cppAnnual: Money.fromDollars(cpp),
      eiAnnual: Money.fromDollars(ei),
      netIncomeAnnual: Money.fromDollars(netAnnual),
      netIncomeMonthly: Money.fromDollars(netAnnual / 12),
    };
  }

  private calculateCppEmployeeAnnual(
    grossAnnual: number,
    config: Readonly<{
      ympe: number;
      basicExemption: number;
      baseRate: number;
      cpp2Yampe: number;
      cpp2Rate: number;
    }>,
  ): number {
    const contributory = Math.max(0, Math.min(grossAnnual, config.ympe) - config.basicExemption);
    const baseCpp = contributory * config.baseRate;

    const cpp2Earnings = Math.max(0, Math.min(grossAnnual, config.cpp2Yampe) - config.ympe);
    const cpp2 = cpp2Earnings * config.cpp2Rate;

    return baseCpp + cpp2;
  }

  private calculateEiEmployeeAnnual(
    grossAnnual: number,
    config: Readonly<{ maxInsurableEarnings: number; employeeRate: number }>,
  ): number {
    const insurable = Math.max(0, Math.min(grossAnnual, config.maxInsurableEarnings));
    return insurable * config.employeeRate;
  }
}

