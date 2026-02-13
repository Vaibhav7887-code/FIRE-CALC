import { PropsWithChildren } from "react";

type Props = PropsWithChildren<{ htmlFor: string }>;

export function FieldLabel(props: Props) {
  return (
    <label htmlFor={props.htmlFor} className="text-sm font-semibold text-slate-800">
      {props.children}
    </label>
  );
}

