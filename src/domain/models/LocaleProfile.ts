export type TaxProvince = "BC";
export type Country = "CA";

export type LocaleProfile = Readonly<{
  country: Country;
  province: TaxProvince;
  city: "Vancouver";
  taxYear: number;
}>;

export class LocaleProfileFactory {
  public static createDefault(): LocaleProfile {
    return {
      country: "CA",
      province: "BC",
      city: "Vancouver",
      taxYear: new Date().getFullYear(),
    };
  }
}

