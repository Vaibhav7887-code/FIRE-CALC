import { describe, expect, it } from "vitest";
import { RegisteredRoomManager } from "@/domain/managers/registered/RegisteredRoomManager";
import { BudgetSessionFactory } from "@/domain/models/BudgetSession";
import { InvestmentBucketFactory } from "@/domain/models/InvestmentBucket";
import { Money } from "@/domain/models/Money";

describe("RegisteredRoomManager", () => {
  it("computes accrued/used/remaining for TFSA including backfill for the tax year", () => {
    const session = BudgetSessionFactory.createNew();
    const member = session.members[0]!;

    const updatedMember = {
      ...member,
      tfsaRoomEntries: [
        { year: 2026, room: Money.fromDollars(7000) },
      ],
    };

    const tfsa = {
      ...InvestmentBucketFactory.createDefault("TFSA", updatedMember.id),
      monthlyContribution: Money.fromDollars(100),
      isRecurringMonthly: true,
      backfillContributions: [{ year: 2026, amount: Money.fromDollars(5000) }],
    };

    const updatedSession = {
      ...session,
      locale: { ...session.locale, taxYear: 2026 },
      members: [updatedMember],
      investments: [tfsa],
    };

    const mgr = new RegisteredRoomManager();
    const summary = mgr.buildForMember(updatedSession, updatedMember, 2026);

    expect(summary.tfsaAccruedRoomCents).toBe(7000_00);
    expect(summary.tfsaUsedTotalCents).toBe(6200_00); // 100*12 + 5000
    expect(summary.tfsaRemainingCents).toBe(800_00);
  });
});

