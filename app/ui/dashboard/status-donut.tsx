'use client'

import { PieChart, Pie, Sector, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { DefaultLegendContentProps, PieSectorShapeProps, PieLabelRenderProps } from 'recharts'
import type { StatusRow } from '@/app/lib/data'

const DISPLAY: Record<string, string> = { booked: 'Booked', done: 'Done', no_show: 'No-show' }
const COLOURS: Record<string, string> = { Booked: '#2563eb', Done: '#16a34a', 'No-show': '#dc2626' }

function Slice(props: PieSectorShapeProps) {
  return <Sector {...props} fill={COLOURS[String(props.name)] ?? '#9ca3af'} />
}

function StatusLegend({ payload = [] }: DefaultLegendContentProps) {
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
      {payload.map((entry) => {
        const name = entry.value ?? ''
        return (
          <li key={name} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: COLOURS[name] ?? '#9ca3af' }}
            />
            <span>{name}</span>
          </li>
        )
      })}
    </ul>
  )
}

function SliceLabel({ x, y, textAnchor, name, value, percent }: PieLabelRenderProps) {
  const pct = Math.round((percent ?? 0) * 100)
  return (
    <text x={x} y={y} textAnchor={textAnchor} fontSize={12} fill="#111827">
      {String(name)}: {value} ({pct}%)
    </text>
  )
}

export default function StatusDonut({ rows }: { rows: StatusRow[] }) {
  const total = rows.reduce((n, r) => n + r.total, 0)
  if (total === 0) {
    return <p className="text-sm text-gray-500">No appointments this month yet. Add one to see the split.</p>
  }
  const data = rows.map((r) => ({ name: DISPLAY[r.status] ?? r.status, value: r.total }))
  const noShow = rows.find((r) => r.status === 'no_show')?.total ?? 0

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            shape={Slice}
            label={SliceLabel}
            labelLine
          />
          <Tooltip />
          <Legend content={StatusLegend} />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-sm">
        {Math.round((noShow / total) * 100)}% of {total} appointments this month were no-shows.
        The owner decides whether to send reminder messages.
      </p>
    </div>
  )
}