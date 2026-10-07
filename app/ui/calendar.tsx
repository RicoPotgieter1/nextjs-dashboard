'use client'

import { Calendar } from '@fullcalendar/react'
import themePlugin from '@fullcalendar/react/themes/monarch'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import listPlugin from '@fullcalendar/react/list'

import './calendarStyle.css'
import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/monarch/theme.css'
import '@fullcalendar/react/themes/monarch/palettes/blue.css'

export function App() {
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
        headerToolbar={{
          start: 'add today prev,next title',
          end: 'dayGridMonth,dayGridWeek,listWeek',
        }}
        buttons={{
          add: {
            text: 'Add Event',
            click() {
              alert('handle add event...')
            },
          },
        }}
        initialView='dayGridMonth'
      />
    </div>
  )
}
