"use client";

import { useMemo, useRef, useState } from "react";
import { AllocationSegment } from "@/domain/viewmodels/BudgetDashboardViewData";

export type AllocationSliderChange = Readonly<{
  leftKey: string;
  rightKey: string;
  deltaCents: number;
}>;

type Props = Readonly<{
  totalCents: number;
  segments: ReadonlyArray<AllocationSegment>;
  onChange: (change: AllocationSliderChange) => void;
}>;

class SliderMath {
  public static snapCents(value: number, snapDollars: number): number {
    const snap = Math.max(1, Math.round(snapDollars * 100));
    return Math.round(value / snap) * snap;
  }

  public static clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}

export function AllocationSlider(props: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragHandleIndex, setDragHandleIndex] = useState<number | null>(null);

  const segments = useMemo(() => {
    // Hide segments with 0 cents (except unallocated) to reduce clutter.
    const visible = props.segments.filter((s) => s.cents > 0 || s.key === "unallocated");
    return visible.length === 0 ? props.segments : visible;
  }, [props.segments]);

  const boundaries = useMemo(() => {
    let sum = 0;
    return segments.map((s) => {
      const start = sum;
      sum += s.cents;
      return { key: s.key, startCents: start, endCents: sum };
    });
  }, [segments]);

  const handleCount = Math.max(0, boundaries.length - 1);

  const onPointerDown = (handleIndex: number) => (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragHandleIndex(handleIndex);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragHandleIndex === null) return;
    const el = containerRef.current;
    if (!el) return;

    // Segments can change (e.g. auto-redirects, reordering) while dragging.
    // Guard against stale handle index to avoid crashes.
    if (dragHandleIndex < 0 || dragHandleIndex >= boundaries.length - 1) {
      setDragHandleIndex(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = SliderMath.clamp(x / rect.width, 0, 1);

    const targetCents = SliderMath.snapCents(pct * props.totalCents, 10);

    const left = boundaries[dragHandleIndex]!;
    const right = boundaries[dragHandleIndex + 1]!;

    const currentBoundary = left.endCents;
    const delta = targetCents - currentBoundary;
    if (delta === 0) return;

    props.onChange({
      leftKey: left.key,
      rightKey: right.key,
      deltaCents: delta,
    });
  };

  const onPointerUp = () => setDragHandleIndex(null);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative h-10 w-full select-none overflow-hidden rounded-xl border border-slate-200 bg-white"
      >
        <div className="flex h-full w-full">
          {boundaries.map((b) => {
            const seg = segments.find((s) => s.key === b.key)!;
            const widthPct = props.totalCents <= 0 ? 0 : (seg.cents / props.totalCents) * 100;
            return (
              <div
                key={seg.key}
                className={[seg.colorClass, "h-full"].join(" ")}
                style={{ width: `${widthPct}%` }}
                title={`${seg.label}: $${(seg.cents / 100).toFixed(2)}`}
              />
            );
          })}
        </div>

        {Array.from({ length: handleCount }).map((_, i) => {
          const boundary = boundaries[i]!;
          const pct = props.totalCents <= 0 ? 0 : (boundary.endCents / props.totalCents) * 100;
          return (
            <div
              key={i}
              onPointerDown={onPointerDown(i)}
              className={[
                "absolute top-0 h-full w-2 cursor-ew-resize",
                "bg-white/70 hover:bg-white",
                "border-l border-r border-slate-300",
              ].join(" ")}
              style={{ left: `calc(${pct}% - 4px)` }}
              title="Drag to reallocate"
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {segments.map((s) => (
          <div
            key={s.key}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
          >
            <span className={["inline-block h-2 w-2 rounded-full", s.colorClass].join(" ")} />
            <span className="font-semibold text-slate-900">{s.label}</span>
            <span className="text-slate-600">${(s.cents / 100).toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

