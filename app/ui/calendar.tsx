'use client'

import { Calendar } from '@fullcalendar/react'
import themePlugin from '@fullcalendar/react/themes/monarch'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import listPlugin from '@fullcalendar/react/list'
import type { AppointmentRow } from '@/app/lib/data'

import './calendarStyle.css'
import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/monarch/theme.css'
import '@fullcalendar/react/themes/monarch/palettes/blue.css'

const STATUS_COLOURS = {
  booked: '#2563eb',
  done: '#16a34a',
  no_show: '#dc2626',
}

export function App({ appointments }: { appointments: AppointmentRow[] }) {
  return (
    <div className="calendar-responsive">
      <Calendar
        colorScheme='light'
        height='100%'
        plugins={[
          themePlugin,
          dayGridPlugin,
          listPlugin,
        ]}
        events={appointments.map((appointment) => ({
          id: appointment.id,
          title: appointment.patient_name ?? 'Unknown patient',
          start: appointment.starts_at,
          url: `/dashboard/appointments/${appointment.id}/edit`,
          color: STATUS_COLOURS[appointment.status],
          contrastColor: '#ffffff',
        }))}
        headerToolbar={{
          start: 'today prev,next title',
          end: 'dayGridMonth,dayGridWeek,listWeek',
        }}
        initialView='dayGridMonth'
      />
    </div>
  )
}
