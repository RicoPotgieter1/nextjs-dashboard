import RevenueChart from '@/app/ui/dashboard/revenue-chart';
import LatestInvoices from '@/app/ui/dashboard/latest-invoices';
import { lusitana } from '@/app/ui/fonts';
import CardWrapper from '@/app/ui/dashboard/cards';
import { Suspense } from 'react';
import { 
    RevenueChartSkeleton,
    LatestInvoicesSkeleton,
    CardsSkeleton
  } from '@/app/ui/skeletons';
import { Metadata } from 'next';

import { fetchPatientsPerMonth, fetchAppointmentStatusThisMonth } from '@/app/lib/data'
import PatientsChart from '@/app/ui/dashboard/patients-chart'
import StatusDonut from '@/app/ui/dashboard/status-donut'

export const metadata: Metadata = {
  title: 'Dashboard',
};

  export default async function Page() {
    const [perMonth, statusRows] = await Promise.all([
    fetchPatientsPerMonth(),
    fetchAppointmentStatusThisMonth(),
    ]) 
  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<CardsSkeleton />}>
          <CardWrapper />
        </Suspense>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <Suspense fallback={<RevenueChartSkeleton />}>
          <RevenueChart />
        </Suspense>
        
        <Suspense fallback={<LatestInvoicesSkeleton />}>
          <LatestInvoices />
        </Suspense>

        <div className="w-full md:col-span-4">
          <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
            What share of this month's appointments are no-shows?
          </h2>

          <div className="rounded-xl bg-gray-50 p-4">
            <StatusDonut rows={statusRows} />
          </div>
        </div>

      </div>
    </main>
  );
}