export type Cents = number;

export class CentsGuards {
  public static assertIsIntegerCents(value: number, label: string): void {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new Error(`${label} must be an integer cents value.`);
    }
  }
}

