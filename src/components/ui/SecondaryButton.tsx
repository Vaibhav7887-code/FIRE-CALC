"use client";

import { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}>;

export function SecondaryButton(props: Props) {
  return (
    <button
      type={props.type ?? "button"}
      disabled={props.disabled}
      onClick={props.onClick}
      className={[
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold",
        "border border-slate-300 bg-white text-slate-900 shadow-sm",
        "hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white",
      ].join(" ")}
    >
      {props.children}
    </button>
  );
}

