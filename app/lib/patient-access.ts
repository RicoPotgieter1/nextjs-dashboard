import { createClient } from '@/app/lib/supabase/server';

export async function fetchVisiblePatientIds(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Failed to verify the current user: ${userError.message}`);
  }

  if (!user) return [];

  const patientIds: string[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('patients')
      .select('id')
      .order('id')
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch visible patients: ${error.message}`);
    }

    patientIds.push(...data.map((patient) => patient.id));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return patientIds;
}
