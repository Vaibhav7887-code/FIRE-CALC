export type Identifier = string;

export class IdentifierFactory {
  public static create(): Identifier {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    // Very small fallback for environments without crypto.randomUUID
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

