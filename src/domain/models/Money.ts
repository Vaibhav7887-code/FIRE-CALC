import { Cents, CentsGuards } from "@/domain/models/Cents";

export class Money {
  private readonly cents: Cents;

  private constructor(cents: Cents) {
    CentsGuards.assertIsIntegerCents(cents, "Money.cents");
    this.cents = cents;
  }

  public static zero(): Money {
    return new Money(0);
  }

  public static fromCents(cents: Cents): Money {
    return new Money(cents);
  }

  public static fromDollars(dollars: number): Money {
    if (!Number.isFinite(dollars)) throw new Error("Money.fromDollars: invalid");
    return new Money(Math.round(dollars * 100));
  }

  public static parseCadDollars(input: string): Money {
    const normalized = input.trim().replaceAll(",", "");
    if (normalized.length === 0) return Money.zero();

    const value = Number(normalized);
    if (!Number.isFinite(value)) throw new Error("Invalid money amount.");
    return Money.fromDollars(value);
  }

  public getCents(): Cents {
    return this.cents;
  }

  public isNegative(): boolean {
    return this.cents < 0;
  }

  public add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  public subtract(other: Money): Money {
    return new Money(this.cents - other.cents);
  }

  public min(other: Money): Money {
    return this.cents <= other.cents ? this : other;
  }

  public max(other: Money): Money {
    return this.cents >= other.cents ? this : other;
  }

  public clamp(min: Money, max: Money): Money {
    return this.max(min).min(max);
  }

  public formatCad(): string {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 2,
    }).format(this.cents / 100);
  }
}

