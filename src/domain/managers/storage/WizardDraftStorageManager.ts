import { WizardFormInputValues } from "@/components/wizard/WizardSchema";

export type WizardDraftSnapshotV1 = Readonly<{
  version: 1;
  savedAtIso: string;
  stepIndex: number;
  values: WizardFormInputValues;
}>;

export class WizardDraftStorageManager {
  private readonly storageKeyV1: string;

  public constructor(storageKeyV1: string = "budgeting.wizard.draft.v1") {
    this.storageKeyV1 = storageKeyV1;
  }

  public save(snapshot: WizardDraftSnapshotV1): void {
    try {
      localStorage.setItem(this.storageKeyV1, JSON.stringify(snapshot));
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
  }

  public load(): WizardDraftSnapshotV1 | null {
    try {
      const raw = localStorage.getItem(this.storageKeyV1);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as WizardDraftSnapshotV1;
      if (!parsed || parsed.version !== 1) return null;
      if (!parsed.values || typeof parsed.stepIndex !== "number") return null;
      return parsed;
    } catch {
      return null;
    }
  }

  public clear(): void {
    try {
      localStorage.removeItem(this.storageKeyV1);
    } catch {
      // ignore
    }
  }
}

