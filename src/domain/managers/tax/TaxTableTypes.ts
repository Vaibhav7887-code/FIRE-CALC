export type TaxBracket = Readonly<{
  fromInclusive: number;
  toInclusive: number | null;
  rate: number;
  constant: number;
}>;

export type PhaseOutRange = Readonly<{
  startInclusive: number;
  endInclusive: number;
}>;

export type BasicPersonalAmountConfig = Readonly<{
  minAmount: number;
  maxAmount: number;
  phaseOut: PhaseOutRange;
}>;

export type TaxReductionConfig = Readonly<{
  maxReduction: number;
  fullReductionMaxIncome: number;
  phaseOutEndIncome: number;
  phaseOutRate: number;
}>;

export type PayrollContributionConfig = Readonly<{
  cpp: Readonly<{
    ympe: number;
    basicExemption: number;
    baseRate: number;
    cpp2Yampe: number;
    cpp2Rate: number;
  }>;
  ei: Readonly<{
    maxInsurableEarnings: number;
    employeeRate: number;
  }>;
}>;

export type TaxYearConfig = Readonly<{
  year: number;
  federal: Readonly<{
    brackets: ReadonlyArray<TaxBracket>;
    basicPersonalAmount: BasicPersonalAmountConfig;
    lowestRate: number;
    employmentAmountMax: number;
  }>;
  bc: Readonly<{
    brackets: ReadonlyArray<TaxBracket>;
    basicPersonalAmount: number;
    lowestRate: number;
    taxReduction: TaxReductionConfig;
  }>;
  payroll: PayrollContributionConfig;
}>;

