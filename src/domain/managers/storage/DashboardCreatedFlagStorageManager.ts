export class DashboardCreatedFlagStorageManager {
  private readonly storageKeyV1: string;

  public constructor(storageKeyV1: string = "budgeting.dashboard.created.v1") {
    this.storageKeyV1 = storageKeyV1;
  }

  public setCreated(): void {
    try {
      localStorage.setItem(this.storageKeyV1, "true");
    } catch {
      // ignore
    }
  }

  public clear(): void {
    try {
      localStorage.removeItem(this.storageKeyV1);
    } catch {
      // ignore
    }
  }

  public isCreated(): boolean {
    try {
      return localStorage.getItem(this.storageKeyV1) === "true";
    } catch {
      return false;
    }
  }
}

