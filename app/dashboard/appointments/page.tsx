import Link from 'next/link'
import { fetchAppointments } from '@/app/lib/data'
import { formatSA } from '@/app/lib/time'
import { deleteAppointment } from '@/app/lib/actions'

const statusStyles = {
  booked: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  no_show: 'bg-red-100 text-red-700',
}

const statusLabels = {
  booked: 'Booked',
  done: 'Done',
  no_show: 'No-show',
}

export default async function Page() {
  const rows = await fetchAppointments()
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage your scheduled appointments.</p>
        </div>
        <Link
          href="/dashboard/appointments/create"
          className="flex h-10 items-center rounded-lg bg-blue-500 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          New appointment
        </Link>
      </div>

      <div className="mt-6 flow-root">
        <div className="inline-block min-w-full align-middle">
          <div className="rounded-lg bg-gray-50 p-2 md:p-3">
            {rows.length === 0 ? (
              <div className="rounded-md bg-white px-4 py-12 text-center">
                <p className="text-sm font-medium text-gray-900">No appointments yet</p>
                <p className="mt-1 text-sm text-gray-500">Create an appointment to get started.</p>
              </div>
            ) : (
              <>
                <div className="md:hidden">
                  {rows.map((appointment) => {
                    const remove = deleteAppointment.bind(null, appointment.id)
                    return (
                      <article key={appointment.id} className="mb-2 rounded-md bg-white p-4 last:mb-0">
                        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
                          <div>
                            <p className="font-medium text-gray-900">{appointment.patient_name ?? 'Unknown patient'}</p>
                            <p className="mt-1 text-sm text-gray-500">{formatSA(appointment.starts_at)}</p>
                          </div>
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[appointment.status]}`}>
                            {statusLabels[appointment.status]}
                          </span>
                        </div>
                        <div className="flex justify-end gap-4 pt-3 text-sm font-medium">
                          <Link className="text-blue-600 hover:text-blue-800" href={`/dashboard/appointments/${appointment.id}/edit`}>Edit</Link>
                          <form action={remove}>
                            <button type="submit" className="text-red-600 hover:text-red-800">Delete</button>
                          </form>
                        </div>
                      </article>
                    )
                  })}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full text-left text-sm text-gray-900">
                    <thead className="text-sm text-gray-600">
                      <tr>
                        <th scope="col" className="px-4 py-4 font-medium">Patient</th>
                        <th scope="col" className="px-3 py-4 font-medium">Date and time</th>
                        <th scope="col" className="px-3 py-4 font-medium">Status</th>
                        <th scope="col" className="px-4 py-4"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {rows.map((appointment) => {
                        const remove = deleteAppointment.bind(null, appointment.id)
                        return (
                          <tr key={appointment.id} className="border-t border-gray-100">
                            <td className="whitespace-nowrap px-4 py-4 font-medium">{appointment.patient_name ?? 'Unknown patient'}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-gray-600">{formatSA(appointment.starts_at)}</td>
                            <td className="whitespace-nowrap px-3 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[appointment.status]}`}>
                                {statusLabels[appointment.status]}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-4">
                              <div className="flex justify-end gap-4 font-medium">
                                <Link className="text-blue-600 hover:text-blue-800" href={`/dashboard/appointments/${appointment.id}/edit`}>Edit</Link>
                                <form action={remove}>
                                  <button type="submit" className="text-red-600 hover:text-red-800">Delete</button>
                                </form>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}