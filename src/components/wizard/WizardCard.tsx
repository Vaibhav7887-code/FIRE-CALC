import { PropsWithChildren } from "react";

export function WizardCard(props: PropsWithChildren) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {props.children}
    </div>
  );
}

