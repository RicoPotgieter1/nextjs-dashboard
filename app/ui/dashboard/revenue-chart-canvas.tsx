'use client';

import Chart from 'chart.js/auto';
import { useEffect, useRef } from 'react';
import { Revenue } from '@/app/lib/definitions';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function RevenueChartCanvas({
  revenue,
}: {
  revenue: Revenue[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: revenue.map(({ month }) => month),
        datasets: [
          {
            label: 'Revenue',
            data: revenue.map(({ revenue: amount }) => amount),
            backgroundColor: '#93c5fd',
            borderRadius: 6,
            maxBarThickness: 48,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: ({ parsed }) =>
                parsed.y === null
                  ? undefined
                  : currencyFormatter.format(parsed.y),
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              autoSkip: false,
              maxRotation: 45,
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => currencyFormatter.format(Number(value)),
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [revenue]);

  return (
    <div className="h-[350px] rounded-md bg-white p-4">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Bar chart showing revenue by month"
      />
    </div>
  );
}
