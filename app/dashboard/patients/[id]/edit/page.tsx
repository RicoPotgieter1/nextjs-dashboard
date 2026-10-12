import { notFound } from 'next/navigation';
import { fetchPatientById } from '@/app/lib/data';
import { deletePatientFile } from '@/app/lib/actions';
import EditForm from '@/app/ui/patients/edit-form';
import { UploadForm } from '@/app/ui/patients/upload-form';
import { createClient } from '@/app/lib/supabase/server';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const patient = await fetchPatientById(id);

  if (!patient) {
    notFound();
  }

  let fileUrl: string | null = null;
  let fileName: string | null = null;
  if (patient.file_path) {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from('patient-files')
      .createSignedUrl(patient.file_path, 60);

    if (error) {
      throw new Error(`Failed to create patient file URL: ${error.message}`);
    }
    fileUrl = data?.signedUrl ?? null;
    fileName = patient.file_path.split('/').pop() ?? null;
  }

  return (
    <main>
      <h1 className="mb-6 text-2xl">Edit patient</h1>
      <EditForm patient={patient} />
      <section className="mt-8 rounded-md bg-gray-50 p-4 md:p-6">
        <h2 className="mb-3 text-lg font-medium text-gray-900">Patient file</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {patient.file_path ? (
            <>
              {fileUrl ? (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm font-medium text-blue-600 underline hover:text-blue-800"
                  title={fileName ?? 'Patient file'}
                >
                  {fileName ?? 'Patient file'}
                </a>
              ) : (
                <span className="truncate text-sm font-medium text-gray-700">
                  {fileName ?? 'Patient file'}
                </span>
              )}
              <form action={deletePatientFile.bind(null, patient.id)}>
                <button
                  type="submit"
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                >
                  Delete file
                </button>
              </form>
            </>
          ) : (
            <p className="text-sm text-gray-500">No file yet.</p>
          )}
        </div>
        <div className="mt-4">
          <UploadForm patientId={patient.id} disabled={Boolean(patient.file_path)} />
        </div>
      </section>
    </main>
  );
}