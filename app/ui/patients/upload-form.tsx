'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { Button } from '@/app/ui/button';
import { uploadPatientFile, type UploadPatientFileState } from '@/app/lib/actions';

export function UploadForm({ patientId, disabled = false }: { patientId: string; disabled?: boolean }) {
  const [attemptedUpload, setAttemptedUpload] = useState(false);
  const [state, formAction, pending] = useActionState(
    uploadPatientFile.bind(null, patientId),
    {} satisfies UploadPatientFileState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 md:flex-row md:items-end">
      <div className="w-full">
        <label htmlFor="file" className="mb-2 block text-sm font-medium text-gray-700">
          {attemptedUpload && disabled && (
            <p className="text-sm text-gray-500 md:self-center" aria-live="polite">
              Delete the existing file to enable uploading another one.
            </p>
          )}
        </label>
        <input
          id="file"
          type="file"
          name="file"
          required
          accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={(event) => setAttemptedUpload(Boolean(disabled && event.currentTarget.files?.length))}
          className="block w-full cursor-pointer rounded-md border border-gray-300 bg-white py-2.5 pl-3 pr-3 text-sm text-gray-600 shadow-sm transition-colors file:mr-4 file:rounded-md file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <Button
        type="submit"
        disabled={disabled || pending}
        className="whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50 mb-2"
      >
        {pending ? 'Uploading...' : 'Upload'}
      </Button>
      {state.message && (
        <p
          className={`text-sm ${state.success ? 'text-green-700' : 'text-red-500'}`}
          aria-live="polite"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}