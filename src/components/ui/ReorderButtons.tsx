"use client";

import { SecondaryButton } from "@/components/ui/SecondaryButton";

type Props = Readonly<{
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}>;

export function ReorderButtons(props: Props) {
  return (
    <div className="flex items-center gap-2">
      <SecondaryButton disabled={!props.canMoveUp} onClick={props.onMoveUp}>
        ↑
      </SecondaryButton>
      <SecondaryButton disabled={!props.canMoveDown} onClick={props.onMoveDown}>
        ↓
      </SecondaryButton>
    </div>
  );
}

