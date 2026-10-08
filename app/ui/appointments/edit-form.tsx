import { updateAppointment } from '@/app/lib/actions'
import { toDateTimeLocal } from '@/app/lib/time'
import Link from 'next/link'
import { Button } from '@/app/ui/button'

type Appointment = {
  id: string
  patient_id: string
  starts_at: string
  status: 'booked' | 'done' | 'no_show'
}

export default function EditAppointmentForm({ appointment, patients }: { appointment: Appointment; patients: { id: string; full_name: string }[] }) {
  const update = updateAppointment.bind(null, appointment.id)
  return (
    <section className="w-full max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Edit appointment</h1>
        <p className="mt-1 text-sm text-gray-500">Update the patient, schedule, or status.</p>
      </div>
      <form action={update}>
        <div className="rounded-lg bg-gray-50 p-4 md:p-6">
          <div className="mb-5">
            <label htmlFor="patient_id" className="mb-2 block text-sm font-medium text-gray-900">Patient</label>
            <select
              id="patient_id"
              name="patient_id"
              defaultValue={appointment.patient_id}
              required
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="" disabled>Select a patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>{patient.full_name}</option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label htmlFor="starts_at" className="mb-2 block text-sm font-medium text-gray-900">Date and time</label>
            <input
              id="starts_at"
              type="datetime-local"
              name="starts_at"
              defaultValue={toDateTimeLocal(appointment.starts_at)}
              required
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-medium text-gray-900">Status</label>
            <select
              id="status"
              name="status"
              defaultValue={appointment.status}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="booked">Booked</option>
              <option value="done">Done</option>
              <option value="no_show">No-show</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Link
            href="/dashboard/appointments"
            className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            Cancel
          </Link>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </section>
  )
}