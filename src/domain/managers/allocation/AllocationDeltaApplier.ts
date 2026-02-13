import { AllocationSegment } from "@/domain/viewmodels/BudgetDashboardViewData";
import { SegmentCentsUpdate } from "@/domain/managers/allocation/SessionAllocationUpdater";

export type AllocationDeltaChange = Readonly<{
  leftKey: string;
  rightKey: string;
  deltaCents: number;
}>;

export class AllocationDeltaApplier {
  public computeUpdates(
    segments: ReadonlyArray<AllocationSegment>,
    change: AllocationDeltaChange,
  ): ReadonlyArray<SegmentCentsUpdate> {
    const visible = AllocationDeltaApplierVisibility.visibleSegments(segments);
    const leftIndex = visible.findIndex((s) => s.key === change.leftKey);
    const rightIndex = visible.findIndex((s) => s.key === change.rightKey);
    if (leftIndex < 0 || rightIndex < 0) return [];

    const centsByKey = new Map(visible.map((s) => [s.key, s.cents] as const));
    const delta = Math.round(change.deltaCents);
    if (delta === 0) return [];

    if (delta > 0) {
      // Move boundary right: grow left by collapsing right-side segments (right, right+1, ...).
      const taken = this.takeFromChain(visible, centsByKey, rightIndex, +1, delta);
      this.addCents(centsByKey, change.leftKey, taken);
    } else {
      // Move boundary left: grow right by collapsing previous segments (..., left-1, left).
      const taken = this.takeFromChain(visible, centsByKey, leftIndex, -1, -delta);
      this.addCents(centsByKey, change.rightKey, taken);
    }

    return this.toUpdates(visible, segments, centsByKey);
  }

  private takeFromChain(
    ordered: ReadonlyArray<AllocationSegment>,
    centsByKey: Map<string, number>,
    startIndex: number,
    direction: -1 | 1,
    neededCents: number,
  ): number {
    let remaining = Math.max(0, Math.round(neededCents));
    let taken = 0;

    for (
      let i = startIndex;
      i >= 0 && i < ordered.length && remaining > 0;
      i += direction
    ) {
      const key = ordered[i]!.key;
      const current = centsByKey.get(key) ?? 0;
      const take = Math.min(Math.max(0, current), remaining);
      centsByKey.set(key, current - take);
      remaining -= take;
      taken += take;
    }

    return taken;
  }

  private addCents(centsByKey: Map<string, number>, key: string, add: number): void {
    const current = centsByKey.get(key) ?? 0;
    centsByKey.set(key, current + Math.max(0, Math.round(add)));
  }

  private toUpdates(
    visible: ReadonlyArray<AllocationSegment>,
    originalSegments: ReadonlyArray<AllocationSegment>,
    centsByKey: Map<string, number>,
  ): ReadonlyArray<SegmentCentsUpdate> {
    const originalByKey = new Map(originalSegments.map((s) => [s.key, s.cents] as const));
    const updates: SegmentCentsUpdate[] = [];

    for (const s of visible) {
      if (s.key === "unallocated") continue;
      const next = centsByKey.get(s.key) ?? s.cents;
      const prev = originalByKey.get(s.key) ?? s.cents;
      if (next === prev) continue;
      updates.push({ segmentKey: s.key, newCents: Math.max(0, Math.round(next)) });
    }

    return updates;
  }
}

class AllocationDeltaApplierVisibility {
  public static visibleSegments(
    segments: ReadonlyArray<AllocationSegment>,
  ): ReadonlyArray<AllocationSegment> {
    // Mirror AllocationSlider behavior: hide 0 segments (except unallocated).
    const visible = segments.filter((s) => s.cents > 0 || s.key === "unallocated");
    return visible.length === 0 ? segments : visible;
  }
}

