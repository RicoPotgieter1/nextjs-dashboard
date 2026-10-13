import { PatientsTableSkeleton } from '@/app/ui/skeletons'

export default function Loading() {
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <div className="h-8 w-28 rounded-md bg-gray-100" />
        <div className="h-10 w-32 rounded-lg bg-gray-100" />
      </div>
      <PatientsTableSkeleton />
    </div>
  )
}
