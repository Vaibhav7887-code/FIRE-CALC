"use client";

type Props = Readonly<{
  id: string;
  inputMode?: "text" | "decimal" | "numeric";
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}>;

export function TextInput(props: Props) {
  return (
    <input
      id={props.id}
      value={props.value}
      onChange={(e) => props.onChange?.(e.target.value)}
      inputMode={props.inputMode ?? "text"}
      placeholder={props.placeholder}
      disabled={props.disabled}
      className={[
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-slate-400",
        "disabled:bg-slate-100",
      ].join(" ")}
    />
  );
}

