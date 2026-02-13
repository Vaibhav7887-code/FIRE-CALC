type Step = Readonly<{ title: string }>;

type Props = Readonly<{
  steps: ReadonlyArray<Step>;
  currentIndex: number;
}>;

export function WizardStepperHeader(props: Props) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {props.steps.map((s, idx) => {
        const isActive = idx === props.currentIndex;
        const isDone = idx < props.currentIndex;
        return (
          <div
            key={s.title}
            className={[
              "rounded-full px-3 py-1 text-xs font-semibold",
              isActive
                ? "bg-slate-900 text-white"
                : isDone
                  ? "bg-slate-200 text-slate-900"
                  : "bg-slate-100 text-slate-600",
            ].join(" ")}
          >
            {idx + 1}. {s.title}
          </div>
        );
      })}
    </div>
  );
}

