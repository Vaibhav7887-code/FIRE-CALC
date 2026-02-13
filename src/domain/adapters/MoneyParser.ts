import { Money } from "@/domain/models/Money";

export class MoneyParser {
  public static tryParseCadOrZero(input: string | undefined | null): Money {
    const value = (input ?? "").trim();
    if (value.length === 0) return Money.zero();
    try {
      return Money.parseCadDollars(value);
    } catch {
      return Money.zero();
    }
  }
}

