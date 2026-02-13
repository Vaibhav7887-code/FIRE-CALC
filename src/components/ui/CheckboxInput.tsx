"use client";

type Props = Readonly<{
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}>;

export function CheckboxInput(props: Props) {
  return (
    <input
      id={props.id}
      type="checkbox"
      checked={props.checked}
      disabled={props.disabled}
      onChange={(e) => props.onChange(e.target.checked)}
      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
    />
  );
}

