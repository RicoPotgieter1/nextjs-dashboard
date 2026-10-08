import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { generateMockData, RechartsDevtools } from '@recharts/devtools';
import type { perMonth } from '@/app/lib/data'

const DISPLAY: Record<string, string> = { Jan: 'Jan 2026' }

export default function PatientBarChart({ rows }: { rows: perMonth[] }) {
  const total = rows.reduce((n, r) => n + r.new_patients, 0)
  if (total === 0) {
  return <p className="text-sm text-gray-500">No appointments this month yet. Add one to see the split.</p>
  }
  const data = rows.map((r) => ({ name: DISPLAY[r.label] ?? r.label, value: r.new_patients }))
  const noShow = rows.find((r) => r.label === 'no_show')?.new_patients ?? 0 
  return (
    <BarChart
      style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
      responsive
      data={data}
      margin={{
        top: 5,
        right: 0,
        left: 0,
        bottom: 5,
      }}
    >
      <CartesianGrid />
      <XAxis dataKey="label" />
      <YAxis width="auto" />
      <Tooltip />
      <Legend />
      <Bar dataKey="x" radius={[10, 10, 0, 0]} />
      <Bar dataKey="y" radius={[10, 10, 0, 0]} />
      <RechartsDevtools />
    </BarChart>
  );
};