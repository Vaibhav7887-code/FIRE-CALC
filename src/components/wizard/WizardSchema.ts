import { z } from "zod";

const moneyString = z
  .string()
  .trim()
  .refine((v) => v.length > 0, "Required")
  .refine((v) => Number.isFinite(Number(v.replaceAll(",", ""))), "Must be a number");

const moneyStringDefaultZero = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? "0" : v))
  .refine((v) => Number.isFinite(Number(v.replaceAll(",", ""))), "Must be a number");

const percentNumber = z
  .number()
  .min(-50, "Too low")
  .max(100, "Too high");

export const wizardSchema = z
  .object({
  locale: z.object({
    taxYear: z.number().int().min(2000).max(2100),
  }),
  assumedInflationPercent: percentNumber,
  projectionHorizonYears: z.number().int().min(1).max(80),

  members: z
    .array(
      z.object({
        id: z.string().trim().min(1, "Missing member id."),
        displayName: z.string().trim().min(1, "Required"),
        employmentIncomeAnnual: moneyString,
        rrspContributionRoomAnnual: moneyStringDefaultZero,
        tfsaRoomEntries: z.array(
          z.object({
            year: z.number().int().min(2000).max(2100),
            room: moneyString,
          }),
        ),
      }),
    )
    .min(1, "Add at least one household member."),

  householdAllocatedMonthly: moneyString,
  householdCategories: z.array(
    z.object({
      name: z.string().trim().min(1, "Required"),
      monthlyAmount: moneyString,
    }),
  ),

  investments: z.array(
    z.object({
      id: z.string().trim().min(1, "Missing investment id."),
      kind: z.enum(["TFSA", "RRSP", "Custom"]),
      name: z.string().trim().min(1, "Required"),
      ownerMemberId: z.string().trim().optional(),
      startingBalance: moneyStringDefaultZero,
      monthlyContribution: moneyStringDefaultZero,
      startDateIso: z.string().trim().optional(),
      isRecurringMonthly: z.boolean(),
      expectedAnnualReturnPercent: percentNumber,
      backfillContributions: z.array(
        z.object({
          year: z.number().int().min(2000).max(2100),
          amount: moneyStringDefaultZero,
        }),
      ),
    }),
  ),

  templates: z.array(
    z.object({
      kind: z.enum(["ChildFund", "Travel", "Trust", "LargePurchase"]),
      name: z.string().trim().min(1, "Required"),
      monthlyAllocation: moneyStringDefaultZero,
      expectedAnnualReturnPercent: percentNumber,
    }),
  ),

  goalFunds: z.array(
    z.object({
      id: z.string().trim().min(1, "Missing goal id."),
      name: z.string().trim().min(1, "Required"),
      targetAmount: moneyStringDefaultZero,
      currentBalance: moneyStringDefaultZero,
      expectedAnnualReturnPercent: percentNumber,
      monthlyContribution: moneyStringDefaultZero,
      startDateIso: z.string().trim().optional(),
      targetDateIso: z.string().trim().optional(),
    }),
  ),

  debts: z.array(
    z.object({
      id: z.string().trim().min(1, "Missing debt id."),
      name: z.string().trim().min(1, "Required"),
      currentBalance: moneyStringDefaultZero,
      annualAprPercent: percentNumber,
      startDateIso: z.string().trim().optional(),
      payoffPlanKind: z.enum(["monthlyPayment", "targetDate"]),
      monthlyPayment: moneyStringDefaultZero,
      targetPayoffDateIso: z.string().trim().optional(),
    }),
  ),

  redirectRules: z.array(
    z.object({
      id: z.string().trim().min(1, "Missing rule id."),
      sourceKind: z.enum(["GoalFund", "DebtLoan", "RegisteredRoomCeiling"]),
      sourceId: z.string().trim().min(1, "Missing source id."),
      destinationKind: z.enum(["GoalFund", "InvestmentBucket", "DebtLoan", "Unallocated"]),
      destinationId: z.string().trim().optional(),
    }),
  ),
})
  .superRefine((values, ctx) => {
    values.investments.forEach((inv, idx) => {
      const needsOwner = inv.kind === "TFSA" || inv.kind === "RRSP";
      if (needsOwner && (!inv.ownerMemberId || inv.ownerMemberId.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Owner is required for TFSA/RRSP.",
          path: ["investments", idx, "ownerMemberId"],
        });
      }
    });

    values.debts.forEach((d, idx) => {
      if (d.payoffPlanKind === "targetDate" && (!d.targetPayoffDateIso || d.targetPayoffDateIso.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Target payoff date is required.",
          path: ["debts", idx, "targetPayoffDateIso"],
        });
      }
    });

    values.redirectRules.forEach((r, idx) => {
      const needsId =
        r.destinationKind === "GoalFund" ||
        r.destinationKind === "InvestmentBucket" ||
        r.destinationKind === "DebtLoan";
      if (needsId && (!r.destinationId || r.destinationId.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Destination is required.",
          path: ["redirectRules", idx, "destinationId"],
        });
      }
    });
  });

export type WizardFormInputValues = z.input<typeof wizardSchema>;
export type WizardFormValues = z.output<typeof wizardSchema>;

