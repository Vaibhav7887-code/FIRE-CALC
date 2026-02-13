"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MonthlyCentsPoint } from "@/domain/viewmodels/BudgetDashboardViewData";

type Series = Readonly<{
  debtId: string;
  name: string;
  points: ReadonlyArray<MonthlyCentsPoint>;
}>;

type Props = Readonly<{
  series: ReadonlyArray<Series>;
}>;

export function DebtBalanceChart(props: Props) {
  const maxPoints = Math.max(0, ...props.series.map((s) => s.points.length));
  const data: Array<Record<string, number | string>> = [];

  for (let i = 0; i < maxPoints; i++) {
    const monthIndex = props.series[0]?.points[i]?.monthIndex ?? i;
    const row: Record<string, number | string> = {
      year: (monthIndex / 12).toFixed(1),
    };
    for (const s of props.series) {
      row[s.debtId] = (s.points[i]?.cents ?? 0) / 100;
    }
    data.push(row);
  }

  const palette = ["#b91c1c", "#ef4444", "#f87171", "#fb7185", "#991b1b"];

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend />
          {props.series.map((s, idx) => (
            <Line
              key={s.debtId}
              type="monotone"
              dataKey={s.debtId}
              name={s.name}
              stroke={palette[idx % palette.length]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

