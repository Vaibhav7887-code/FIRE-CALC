type Props = Readonly<{ message?: string }>;

export function FieldErrorText(props: Props) {
  if (!props.message) return null;
  return <p className="text-xs font-medium text-red-700">{props.message}</p>;
}

