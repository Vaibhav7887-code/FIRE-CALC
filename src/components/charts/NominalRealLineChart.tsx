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
import { NominalRealPoint } from "@/domain/viewmodels/BudgetDashboardViewData";

type Props = Readonly<{
  series: ReadonlyArray<NominalRealPoint>;
  horizonYears: number;
}>;

export function NominalRealLineChart(props: Props) {
  const data = props.series.map((p) => ({
    year: (p.monthIndex / 12).toFixed(1),
    nominal: p.nominalCents / 100,
    real: p.realCents / 100,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="nominal" stroke="#0f172a" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="real" stroke="#64748b" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

