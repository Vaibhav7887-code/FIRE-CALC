import { Identifier } from "@/domain/models/Identifiers";
import { Money } from "@/domain/models/Money";

export type HouseholdExpenseCategory = Readonly<{
  id: Identifier;
  name: string;
  monthlyAmount: Money;
}>;

