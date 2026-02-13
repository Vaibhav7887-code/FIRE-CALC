export type TfsaLimitByYear = Readonly<Record<number, number>>;

// Annual TFSA dollar limits (CAD) by year.
// Source: CRA published annual TFSA limits (commonly referenced table).
export const TFSA_ANNUAL_LIMITS: TfsaLimitByYear = {
  2009: 5000,
  2010: 5000,
  2011: 5000,
  2012: 5000,
  2013: 5500,
  2014: 5500,
  2015: 10000,
  2016: 5500,
  2017: 5500,
  2018: 5500,
  2019: 6000,
  2020: 6000,
  2021: 6000,
  2022: 6000,
  2023: 6500,
  2024: 7000,
  2025: 7000,
  2026: 7000,
};

export class TfsaLimitProvider {
  public getAnnualLimitDollars(year: number): number {
    return TFSA_ANNUAL_LIMITS[year] ?? 0;
  }
}

