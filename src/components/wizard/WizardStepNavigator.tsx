"use client";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";

type Props = Readonly<{
  isFirst: boolean;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
  isSubmitting: boolean;
}>;

export function WizardStepNavigator(props: Props) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <SecondaryButton onClick={props.onBack} disabled={props.isFirst || props.isSubmitting}>
        Back
      </SecondaryButton>

      <div className="flex items-center gap-2">
        {props.isLast ? (
          <PrimaryButton type="submit" disabled={props.isSubmitting}>
            Create dashboard
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={props.onNext} disabled={props.isSubmitting}>
            Next
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}

