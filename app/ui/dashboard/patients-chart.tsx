'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { perMonth } from '@/app/lib/data';

export default function PatientBarChart({ rows }: { rows: perMonth[] }) {
  const total = rows.reduce((sum, row) => sum + row.new_patients, 0);

  if (total === 0) {
    return <p className="text-sm text-gray-500">No new patients yet. Add one to see the trend.</p>;
  }

  const data = rows.map((row) => ({
    name: row.label,
    patients: row.new_patients,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="patients" fill="#93c5fd" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}