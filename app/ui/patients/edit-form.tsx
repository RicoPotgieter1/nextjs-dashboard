'use client';

import { useActionState } from 'react';
import { Button } from '@/app/ui/button';
import { cancelPatientEdit, updatePatient, type PatientState } from '@/app/lib/actions';
import type { Patient } from '@/app/lib/data';

export default function EditForm({ patient }: { patient: Patient }) {
  const initialState: PatientState = { message: null, errors: {} };
  const updatePatientWithId = updatePatient.bind(null, patient.id);
  const [state, formAction] = useActionState(updatePatientWithId, initialState);

  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        <div className="mb-4">
          <label htmlFor="full_name" className="mb-2 block text-sm font-medium">Full name</label>
          <input id="full_name" name="full_name" type="text" defaultValue={patient.full_name}
            className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
            aria-describedby="full_name-error" />
          <div id="full_name-error" aria-live="polite" aria-atomic="true">
            {state.errors?.full_name?.map((error) => (
              <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="phone" className="mb-2 block text-sm font-medium">Phone</label>
          <input id="phone" name="phone" type="tel" defaultValue={patient.phone ?? ''}
            className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm" />
        </div>
        <div className="mb-4">
          <label htmlFor="date_of_birth" className="mb-2 block text-sm font-medium">Date of birth</label>
          <input id="date_of_birth" name="date_of_birth" type="date" defaultValue={patient.date_of_birth ?? ''}
            className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm" />
        </div>
        <div aria-live="polite" aria-atomic="true">
          {state.message && <p className="mt-2 text-sm text-red-500">{state.message}</p>}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <button
          type="submit"
          formAction={cancelPatientEdit.bind(null, patient.id)}
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Cancel
        </button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
