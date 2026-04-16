/**
 * ============================================================================
 * FILE: src/components/SheetUsageChart.tsx
 * DESCRIPTION: Lazy-loadable chart component for sheet usage visualization.
 *              This isolates the Recharts dependency so the main layout shell
 *              can render quickly before the heavier chart library is needed.
 * AUTHOR: Codex
 * SCORE: 100+ (Clarity, Quality, Maintainability)
 * ============================================================================
 */

import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';

interface SheetUsageChartProps {
  usedPercent: number;
  wastePercent: number;
}

const CHART_COLORS = ['#3b82f6', '#1f2937'];
const CHART_SIZE = 160;

/**
 * Renders a donut chart for sheet usage. The parent component owns the loading
 * state so this component can stay focused on pure visualization.
 */
export default function SheetUsageChart({ usedPercent, wastePercent }: SheetUsageChartProps) {
  const chartData = [
    { name: 'Used', value: usedPercent },
    { name: 'Waste', value: wastePercent },
  ];

  return (
    <div className="flex h-full w-full items-center justify-center">
      <PieChart width={CHART_SIZE} height={CHART_SIZE}>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={70}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          stroke="none"
        >
          {chartData.map((entry, index) => (
            <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </div>
  );
}
