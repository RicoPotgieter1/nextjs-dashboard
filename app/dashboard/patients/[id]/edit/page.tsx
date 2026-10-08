import { notFound } from 'next/navigation';
import { fetchPatientById } from '@/app/lib/data';
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
  if (patient.file_path) {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from('patient-files')
      .createSignedUrl(patient.file_path, 60);

    if (error) {
      throw new Error(`Failed to create patient file URL: ${error.message}`);
    }
    fileUrl = data?.signedUrl ?? null;
  }

  return (
    <main>
      <h1 className="mb-6 text-2xl">Edit patient</h1>
      <EditForm patient={patient} />
      <section className="mt-8 rounded-md bg-gray-50 p-4 md:p-6">
        <h2 className="mb-3 text-lg font-medium text-gray-900">Patient file</h2>
        {fileUrl ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 underline hover:text-blue-800"
          >
            Open file
          </a>
        ) : (
          <p className="text-sm text-gray-500">No file yet.</p>
        )}
        <div className="mt-4">
          <UploadForm patientId={patient.id} />
        </div>
      </section>
    </main>
  );
}