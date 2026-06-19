"use client";

import type { PositioningData } from "@/lib/types";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  data: PositioningData[];
}

export default function PositioningMap({ data }: Props) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name="Price"
            domain={[0, 100]}
            tick={{ fill: "#52525b", fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Feature depth"
            domain={[0, 100]}
            tick={{ fill: "#52525b", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{ borderRadius: 6, borderColor: "#d4d4d8" }}
          />
          <Scatter
            name="Competitors"
            data={data}
            fill="#0f766e"
            shape={(props: { cx?: number; cy?: number; payload?: PositioningData }) => {
              const { cx = 0, cy = 0, payload } = props;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={payload?.isOurProduct ? 9 : 6}
                  fill={payload?.isOurProduct ? "#f59e0b" : "#0f766e"}
                  stroke="#18181b"
                  strokeWidth={payload?.isOurProduct ? 2 : 1}
                />
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
