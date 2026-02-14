import { IsoDateString } from "@/domain/models/GoalFund";

export class DateMonthMath {
  private static readonly MONTH_NAMES_SHORT = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ] as const;

  // Uses year/month only, ignores day precision.
  public static monthsBetweenIso(startIso: IsoDateString, endIso: IsoDateString): number {
    const s = DateMonthMath.parseIso(startIso);
    const e = DateMonthMath.parseIso(endIso);
    const months = (e.year - s.year) * 12 + (e.month - s.month);
    return Math.max(0, months);
  }

  /**
   * Returns a stable month key like "YYYY-MM" (day ignored).
   */
  public static monthKey(iso: IsoDateString): string {
    const d = DateMonthMath.parseIso(iso);
    const mm = String(d.month).padStart(2, "0");
    return `${d.year}-${mm}`;
  }

  /**
   * Returns a short month label like "Feb 2026" (day ignored).
   */
  public static formatMonYYYY(iso: IsoDateString): string {
    const d = DateMonthMath.parseIso(iso);
    const m = DateMonthMath.MONTH_NAMES_SHORT[Math.max(0, Math.min(11, d.month - 1))] ?? "Mon";
    return `${m} ${d.year}`;
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
    // IMPORTANT: Avoid `new Date("YYYY-MM-DD")` timezone shifts across environments.
    // We only care about year + month (day ignored).
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
    if (!m) throw new Error("Invalid ISO date.");
    const year = Number(m[1]);
    const month = Number(m[2]);
    if (!Number.isFinite(year) || !Number.isFinite(month)) throw new Error("Invalid ISO date.");
    if (month < 1 || month > 12) throw new Error("Invalid ISO date.");
    return { year, month };
  }
}

