import { createClient } from '@/app/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('file_path')
    .eq('id', id)
    .maybeSingle();

  if (patientError) {
    throw new Error(`Failed to load patient file: ${patientError.message}`);
  }
  if (!patient?.file_path) {
    return new Response('Patient file not found.', { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from('patient-files')
    .createSignedUrl(patient.file_path, 3600);

  if (error) {
    throw new Error(`Failed to create patient file URL: ${error.message}`);
  }

  return NextResponse.redirect(data.signedUrl);
}
