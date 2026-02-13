import { TaxYearConfig } from "@/domain/managers/tax/TaxTableTypes";

// Source: CRA Payroll Deductions Tables T4032-BC (Effective Jan 1, 2026)
// This app uses these tables as an *estimate* for household budgeting.
export const caBcTaxYear2026: TaxYearConfig = {
  year: 2026,
  federal: {
    // Chart 1 (R, K)
    brackets: [
      { fromInclusive: 0, toInclusive: 58523, rate: 0.14, constant: 0 },
      { fromInclusive: 58523.01, toInclusive: 117045, rate: 0.205, constant: 3804 },
      { fromInclusive: 117045.01, toInclusive: 181440, rate: 0.26, constant: 10241 },
      { fromInclusive: 181440.01, toInclusive: 258482, rate: 0.29, constant: 15685 },
      { fromInclusive: 258482.01, toInclusive: null, rate: 0.33, constant: 26024 },
    ],
    // BPA min/max with phase-out across 181,440 → 258,482 (T4032-BC; also matches CRA notes)
    basicPersonalAmount: {
      minAmount: 14829,
      maxAmount: 16452,
      phaseOut: { startInclusive: 181440, endInclusive: 258482 },
    },
    lowestRate: 0.14,
    employmentAmountMax: 1501,
  },
  bc: {
    // Chart 2 (V, KP)
    brackets: [
      { fromInclusive: 0, toInclusive: 50363, rate: 0.0506, constant: 0 },
      { fromInclusive: 50363.01, toInclusive: 100728, rate: 0.077, constant: 1330 },
      { fromInclusive: 100728.01, toInclusive: 115648, rate: 0.105, constant: 4150 },
      { fromInclusive: 115648.01, toInclusive: 140430, rate: 0.1229, constant: 6220 },
      { fromInclusive: 140430.01, toInclusive: 190405, rate: 0.147, constant: 9604 },
      { fromInclusive: 190405.01, toInclusive: 265545, rate: 0.168, constant: 13603 },
      { fromInclusive: 265545.01, toInclusive: null, rate: 0.205, constant: 23428 },
    ],
    basicPersonalAmount: 13216,
    lowestRate: 0.0506,
    taxReduction: {
      maxReduction: 575,
      fullReductionMaxIncome: 25570,
      phaseOutEndIncome: 41722,
      phaseOutRate: 0.0356,
    },
  },
  payroll: {
    cpp: {
      ympe: 74600,
      basicExemption: 3500,
      baseRate: 0.0595,
      cpp2Yampe: 85000,
      cpp2Rate: 0.04,
    },
    ei: {
      maxInsurableEarnings: 68900,
      employeeRate: 0.0163,
    },
  },
};

