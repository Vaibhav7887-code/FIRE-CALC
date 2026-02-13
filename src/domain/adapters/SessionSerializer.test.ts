import { describe, expect, it } from "vitest";
import { SessionSerializer } from "@/domain/adapters/SessionSerializer";

describe("SessionSerializer migration", () => {
  it("migrates v1 snapshot to v3 with a default member and assigns TFSA/RRSP ownership", () => {
    const serializer = new SessionSerializer();
    const v1 = {
      version: 1 as const,
      originalSession: {
        id: "s1",
        locale: { country: "CA", province: "BC", city: "Vancouver", taxYear: 2026 },
        grossHouseholdIncomeAnnualCents: 190_000_00,
        assumedAnnualInflationBps: 200,
        projectionHorizonYears: 30,
        household: { allocatedMonthlyCents: 4000_00, categories: [] },
        investments: [
          {
            id: "tfsa1",
            kind: "TFSA" as const,
            name: "TFSA",
            startingBalanceCents: 0,
            monthlyContributionCents: 100_00,
            oneTimeContributionCents: 0,
            isRecurringMonthly: true,
            expectedAnnualReturnBps: 600,
            tfsaRoomEntries: [{ year: 2026, roomCents: 5000_00 }],
          },
          {
            id: "rrsp1",
            kind: "RRSP" as const,
            name: "RRSP",
            startingBalanceCents: 0,
            monthlyContributionCents: 200_00,
            oneTimeContributionCents: 0,
            isRecurringMonthly: true,
            expectedAnnualReturnBps: 600,
            rrspContributionRoomCents: 20000_00,
          },
        ],
        templates: [],
        luxuryMonthlyCents: 300_00,
        cashSavingsMonthlyCents: 500_00,
      },
      currentSession: {
        id: "s1",
        locale: { country: "CA", province: "BC", city: "Vancouver", taxYear: 2026 },
        grossHouseholdIncomeAnnualCents: 190_000_00,
        assumedAnnualInflationBps: 200,
        projectionHorizonYears: 30,
        household: { allocatedMonthlyCents: 4000_00, categories: [] },
        investments: [],
        templates: [],
        luxuryMonthlyCents: 300_00,
        cashSavingsMonthlyCents: 500_00,
      },
    };

    const v2 = serializer.snapshotFromJson(JSON.stringify(v1));
    expect(v2.version).toBe(3);
    expect(v2.originalSession.members.length).toBe(1);
    const member = v2.originalSession.members[0]!;
    expect(member.employmentIncomeAnnualCents).toBe(190_000_00);
    expect(member.tfsaRoomEntries.length).toBe(1);
    expect(member.rrspContributionRoomAnnualCents).toBe(20000_00);

    const tfsa = v2.originalSession.investments.find((b) => b.kind === "TFSA")!;
    const rrsp = v2.originalSession.investments.find((b) => b.kind === "RRSP")!;
    expect(tfsa.ownerMemberId).toBe(member.id);
    expect(rrsp.ownerMemberId).toBe(member.id);
  });

  it("migrates v2 snapshot to v3 and maps legacy cash/luxury into goal funds", () => {
    const serializer = new SessionSerializer();
    const v2 = {
      version: 2 as const,
      originalSession: {
        id: "s2",
        locale: { country: "CA", province: "BC", city: "Vancouver", taxYear: 2026 },
        members: [
          {
            id: "m1",
            displayName: "You",
            employmentIncomeAnnualCents: 100_000_00,
            tfsaRoomEntries: [],
            rrspContributionRoomAnnualCents: 0,
          },
        ],
        assumedAnnualInflationBps: 200,
        projectionHorizonYears: 30,
        household: { allocatedMonthlyCents: 4000_00, categories: [] },
        investments: [],
        templates: [],
        luxuryMonthlyCents: 300_00,
        cashSavingsMonthlyCents: 500_00,
      },
      currentSession: {
        id: "s2",
        locale: { country: "CA", province: "BC", city: "Vancouver", taxYear: 2026 },
        members: [
          {
            id: "m1",
            displayName: "You",
            employmentIncomeAnnualCents: 100_000_00,
            tfsaRoomEntries: [],
            rrspContributionRoomAnnualCents: 0,
          },
        ],
        assumedAnnualInflationBps: 200,
        projectionHorizonYears: 30,
        household: { allocatedMonthlyCents: 4000_00, categories: [] },
        investments: [],
        templates: [],
        luxuryMonthlyCents: 300_00,
        cashSavingsMonthlyCents: 500_00,
      },
    };

    const v3 = serializer.snapshotFromJson(JSON.stringify(v2));
    expect(v3.version).toBe(3);
    expect(v3.originalSession.goalFunds.length).toBe(2);
    expect(v3.originalSession.debts.length).toBe(0);
    expect(v3.originalSession.ceilingRedirectRules.length).toBe(0);
  });
});

