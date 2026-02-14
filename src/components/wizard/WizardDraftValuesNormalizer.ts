import { wizardSchema, WizardFormInputValues } from "@/components/wizard/WizardSchema";

export class WizardDraftValuesNormalizer {
  /**
   * Restores persisted draft JSON through schema parsing so defaults (eg `planningMode`)
   * are applied safely for older drafts.
   */
  public static normalize(rawValues: unknown): WizardFormInputValues {
    const parsed = wizardSchema.safeParse(rawValues);
    if (parsed.success) return parsed.data as unknown as WizardFormInputValues;
    return rawValues as WizardFormInputValues;
  }
}

