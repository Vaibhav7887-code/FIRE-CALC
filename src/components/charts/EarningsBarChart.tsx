"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EarningsDecomposition } from "@/domain/viewmodels/BudgetDashboardViewData";

type Props = Readonly<{
  data: EarningsDecomposition;
}>;

export function EarningsBarChart(props: Props) {
  const row = {
    name: "End of horizon",
    principal: props.data.principalCents / 100,
    simpleTotal: props.data.simpleInterestTotalCents / 100,
    compoundTotal: props.data.compoundTotalCents / 100,
    compoundDelta: props.data.compoundDeltaCents / 100,
  };

  // Visual: principal vs simple total vs compound total (side-by-side)
  const chartData = [row];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="principal" fill="#0ea5e9" name="Contributions (principal)" />
          <Bar dataKey="simpleTotal" fill="#94a3b8" name="Simple interest total" />
          <Bar dataKey="compoundTotal" fill="#0f172a" name="Compound total" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

