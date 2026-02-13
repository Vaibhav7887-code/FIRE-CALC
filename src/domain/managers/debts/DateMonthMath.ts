import { IsoDateString } from "@/domain/models/GoalFund";

export class DateMonthMath {
  // Uses year/month only, ignores day precision.
  public static monthsBetweenIso(startIso: IsoDateString, endIso: IsoDateString): number {
    const s = DateMonthMath.parseIso(startIso);
    const e = DateMonthMath.parseIso(endIso);
    const months = (e.year - s.year) * 12 + (e.month - s.month);
    return Math.max(0, months);
  }

  public static addMonthsIso(startIso: IsoDateString, monthsToAdd: number): IsoDateString {
    const s = DateMonthMath.parseIso(startIso);
    const total = s.year * 12 + (s.month - 1) + Math.max(0, Math.round(monthsToAdd));
    const year = Math.floor(total / 12);
    const month = (total % 12) + 1;
    const mm = String(month).padStart(2, "0");
    return `${year}-${mm}-01`;
  }

  public static currentMonthIso(): IsoDateString {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  }

  private static parseIso(iso: IsoDateString): Readonly<{ year: number; month: number }> {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid ISO date.");
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }
}

