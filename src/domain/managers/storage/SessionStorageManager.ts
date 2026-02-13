import { PersistedSnapshot, SessionSerializer } from "@/domain/adapters/SessionSerializer";

export class SessionStorageManager {
  private readonly storageKeyV3: string;
  private readonly storageKeyV2: string;
  private readonly storageKeyV1: string;
  private readonly serializer: SessionSerializer;

  public constructor(
    storageKeyV3: string = "budgeting.session.snapshot.v3",
    storageKeyV2: string = "budgeting.session.snapshot.v2",
    storageKeyV1: string = "budgeting.session.snapshot.v1",
    serializer: SessionSerializer = new SessionSerializer(),
  ) {
    this.storageKeyV3 = storageKeyV3;
    this.storageKeyV2 = storageKeyV2;
    this.storageKeyV1 = storageKeyV1;
    this.serializer = serializer;
  }

  public save(snapshot: PersistedSnapshot): void {
    try {
      localStorage.setItem(this.storageKeyV3, this.serializer.snapshotToJson(snapshot));
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
  }

  public load(): PersistedSnapshot | null {
    try {
      const rawV3 = localStorage.getItem(this.storageKeyV3);
      if (rawV3) return this.serializer.snapshotFromJson(rawV3);

      const rawV2 = localStorage.getItem(this.storageKeyV2);
      if (rawV2) return this.serializer.snapshotFromJson(rawV2);

      const rawV1 = localStorage.getItem(this.storageKeyV1);
      if (rawV1) return this.serializer.snapshotFromJson(rawV1);

      return null;
    } catch {
      return null;
    }
  }

  public clear(): void {
    try {
      localStorage.removeItem(this.storageKeyV3);
      localStorage.removeItem(this.storageKeyV2);
      localStorage.removeItem(this.storageKeyV1);
    } catch {
      // ignore
    }
  }
}

