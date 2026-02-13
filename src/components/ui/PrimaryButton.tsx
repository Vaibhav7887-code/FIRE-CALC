"use client";

import { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}>;

export function PrimaryButton(props: Props) {
  return (
    <button
      type={props.type ?? "button"}
      disabled={props.disabled}
      onClick={props.onClick}
      className={[
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold",
        "bg-slate-900 text-white shadow-sm",
        "hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900",
      ].join(" ")}
    >
      {props.children}
    </button>
  );
}

