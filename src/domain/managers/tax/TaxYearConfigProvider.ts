import { TaxYearConfig } from "@/domain/managers/tax/TaxTableTypes";
import { caBcTaxYear2026 } from "@/config/tax/ca-bc-2026";

export class TaxYearConfigProvider {
  private readonly configsByYear: Map<number, TaxYearConfig>;

  public constructor(configs: ReadonlyArray<TaxYearConfig> = [caBcTaxYear2026]) {
    this.configsByYear = new Map(configs.map((c) => [c.year, c]));
  }

  public getOrFallback(year: number): TaxYearConfig {
    return this.configsByYear.get(year) ?? caBcTaxYear2026;
  }
}

