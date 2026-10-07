import { App } from '@/app/ui/calendar'

export default function CalendarPage() {
  return (
    <div className="flex min-h-full w-full min-w-0 flex-col items-center bg-slate-50">
      <div className="h-[calc(100dvh-13rem)] min-h-[30rem] w-full max-w-6xl rounded-xl bg-white p-2 shadow-md sm:h-[75vh] sm:min-h-[34rem] sm:p-4">
        <App />
      </div>
    </div>
  )
}