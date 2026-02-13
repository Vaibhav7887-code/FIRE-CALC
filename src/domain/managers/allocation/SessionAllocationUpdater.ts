import { BudgetSession } from "@/domain/models/BudgetSession";
import { Money } from "@/domain/models/Money";

export type SegmentCentsUpdate = Readonly<{
  segmentKey: string;
  newCents: number;
}>;

export class SessionAllocationUpdater {
  public applySegmentUpdates(
    session: BudgetSession,
    updates: ReadonlyArray<SegmentCentsUpdate>,
  ): BudgetSession {
    let next = session;
    for (const u of updates) {
      next = this.applyOne(next, u.segmentKey, u.newCents);
    }
    return next;
  }

  private applyOne(session: BudgetSession, segmentKey: string, newCents: number): BudgetSession {
    const cents = Math.max(0, Math.round(newCents));
    const amount = Money.fromCents(cents);

    if (segmentKey === "household") {
      return { ...session, household: { ...session.household, allocatedMonthly: amount } };
    }

    if (segmentKey.startsWith("investment:")) {
      const id = segmentKey.slice("investment:".length);
      return {
        ...session,
        investments: session.investments.map((b) =>
          b.id === id ? { ...b, monthlyContribution: amount } : b,
        ),
      };
    }

    if (segmentKey.startsWith("template:")) {
      const id = segmentKey.slice("template:".length);
      return {
        ...session,
        templates: session.templates.map((t) =>
          t.id === id ? { ...t, monthlyAllocation: amount } : t,
        ),
      };
    }

    if (segmentKey.startsWith("goalFund:")) {
      const id = segmentKey.slice("goalFund:".length);
      return {
        ...session,
        goalFunds: session.goalFunds.map((g) =>
          g.id === id ? { ...g, monthlyContribution: amount } : g,
        ),
      };
    }

    if (segmentKey.startsWith("debt:")) {
      const id = segmentKey.slice("debt:".length);
      return {
        ...session,
        debts: session.debts.map((d) =>
          d.id === id && d.payoffPlan.kind === "monthlyPayment"
            ? { ...d, payoffPlan: { ...d.payoffPlan, monthlyPayment: amount } }
            : d,
        ),
      };
    }

    return session;
  }
}

