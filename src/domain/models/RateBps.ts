export type BasisPoints = number;

export class RateBps {
  private readonly basisPoints: BasisPoints;

  private constructor(basisPoints: BasisPoints) {
    if (!Number.isFinite(basisPoints) || !Number.isInteger(basisPoints)) {
      throw new Error("RateBps must be integer basis points.");
    }
    this.basisPoints = basisPoints;
  }

  public static zero(): RateBps {
    return new RateBps(0);
  }

  public static fromBasisPoints(basisPoints: BasisPoints): RateBps {
    return new RateBps(basisPoints);
  }

  public static fromPercent(percent: number): RateBps {
    if (!Number.isFinite(percent)) throw new Error("Invalid percent rate.");
    return new RateBps(Math.round(percent * 100));
  }

  public static fromDecimal(decimal: number): RateBps {
    if (!Number.isFinite(decimal)) throw new Error("Invalid decimal rate.");
    return new RateBps(Math.round(decimal * 10000));
  }

  public getBasisPoints(): BasisPoints {
    return this.basisPoints;
  }

  public toDecimal(): number {
    return this.basisPoints / 10000;
  }

  public toPercent(): number {
    return this.basisPoints / 100;
  }
}

