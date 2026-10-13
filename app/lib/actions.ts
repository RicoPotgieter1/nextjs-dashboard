'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { fromDateTimeLocal } from '@/app/lib/time'
import { fetchVisiblePatientIds } from '@/app/lib/patient-access';


const sql = postgres(process.env.POSTGRES_URL!, {ssl: 'require'});
 
const FormSchema = z.object({
  id: z.string(),
  patientId: z.string({
    invalid_type_error: 'Please select a patient.',
  }).uuid({ message: 'Please select a patient.' }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    patientId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};
 
export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
    patientId: formData.get('patientId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
 
  // Prepare data for insertion into the database
  const { patientId, amount, status } = validatedFields.data;
  const visiblePatientIds = await fetchVisiblePatientIds();
  if (!visiblePatientIds.includes(patientId)) {
    return { message: 'You can only create invoices for patients you can access.' };
  }

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
 
  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (patient_id, amount, status, date)
      VALUES (${patientId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
 
  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath('/dashboard/invoices');
  revalidatePath('/dashboard');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    patientId: formData.get('patientId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }
 
  const { patientId, amount, status } = validatedFields.data;
  const visiblePatientIds = await fetchVisiblePatientIds();
  if (
    !visiblePatientIds.includes(patientId) ||
    visiblePatientIds.length === 0
  ) {
    return { message: 'You can only use patients you can access.' };
  }

  const amountInCents = amount * 100;

  try {
    const updated = await sql`
      UPDATE invoices
      SET patient_id = ${patientId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
        AND patient_id = ANY(${sql.array(visiblePatientIds)}::uuid[])
      RETURNING id
    `;
    if (updated.length === 0) {
      return { message: 'Invoice not found or you do not have access to it.' };
    }
  } catch (error) {
    console.error('Database error while updating invoice:', error);
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
 
  revalidatePath('/dashboard/invoices');
  revalidatePath('/dashboard');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  const visiblePatientIds = await fetchVisiblePatientIds();
  if (visiblePatientIds.length === 0) {
    throw new Error('You do not have access to delete this invoice.');
  }

  const deleted = await sql`
    DELETE FROM invoices
    WHERE id = ${id}
      AND patient_id = ANY(${sql.array(visiblePatientIds)}::uuid[])
    RETURNING id
  `;
  if (deleted.length === 0) {
    throw new Error('Invoice not found or you do not have access to delete it.');
  }

  revalidatePath('/dashboard/invoices');
  revalidatePath('/dashboard');
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error) return error.message;

  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

const PatientSchema = z.object({
  full_name: z.string().min(1, { message: 'Please enter the patient\'s full name.' }),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
});

export type PatientState = {
  errors?: {
    full_name?: string[];
    phone?: string[];
    date_of_birth?: string[];
  };
  message?: string | null;
};

export async function createPatient(prevState: PatientState, formData: FormData) {
  const validated = PatientSchema.safeParse({
    full_name: formData.get('full_name'),
    phone: formData.get('phone'),
    date_of_birth: formData.get('date_of_birth'),
  });
  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Missing fields. Failed to create patient.',
    };
  }
  const { full_name, phone, date_of_birth } = validated.data;

  const supabase = await createClient();
  const { error } = await supabase.from('patients').insert({
    full_name,
    phone: phone || null,
    date_of_birth: date_of_birth || null,
    // user_id is not sent: the column default auth.uid() fills it
  });
  if (error) {
    console.error('Supabase error:', error);
    return { message: `Database error ${error.code}: failed to create patient.` };
  }

  revalidatePath('/dashboard/patients');
  redirect('/dashboard/patients');
}

export async function updatePatient(
  id: string,
  prevState: PatientState,
  formData: FormData,
) {
  const validated = PatientSchema.safeParse({
    full_name: formData.get('full_name'),
    phone: formData.get('phone'),
    date_of_birth: formData.get('date_of_birth'),
  });
  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Missing fields. Failed to update patient.',
    };
  }
  const { full_name, phone, date_of_birth } = validated.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from('patients')
    .update({ full_name, phone: phone || null, date_of_birth: date_of_birth || null })
    .eq('id', id);
  if (error) {
    console.error('Supabase error:', error);
    return { message: `Database error ${error.code}: failed to update patient.` };
  }

  revalidatePath('/dashboard/patients');
  redirect('/dashboard/patients');
}

export async function deletePatient(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('patients').delete().eq('id', id);
  if (error) {
    console.error('Supabase error:', error);
    throw new Error(`Database error ${error.code}: failed to delete patient.`);
  }
  revalidatePath('/dashboard/patients');
}

const AppointmentSchema = z.object({
  patient_id: z.string().min(1),
  starts_at: z.string().min(16),
  status: z.enum(['booked', 'done', 'no_show']),
})

function parseAppointment(formData: FormData) {
  return AppointmentSchema.parse({
    patient_id: formData.get('patient_id'),
    starts_at: formData.get('starts_at'),
    status: formData.get('status'),
  })
}

export async function createAppointment(formData: FormData) {
  const a = parseAppointment(formData)
  const supabase = await createClient()
  const { error } = await supabase.from('appointments').insert({
    patient_id: a.patient_id,
    starts_at: fromDateTimeLocal(a.starts_at),
    status: a.status,
  })
  if (error) throw new Error(`${error.code}: ${error.message}`)
  revalidatePath('/dashboard/appointments')
  revalidatePath('/dashboard/calendar')
  redirect('/dashboard/appointments')
}

export async function updateAppointment(id: string, formData: FormData) {
  const a = parseAppointment(formData)
  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({ patient_id: a.patient_id, starts_at: fromDateTimeLocal(a.starts_at), status: a.status })
    .eq('id', id)
  if (error) throw new Error(`${error.code}: ${error.message}`)
  revalidatePath('/dashboard/appointments')
  revalidatePath('/dashboard/calendar')
  redirect('/dashboard/appointments')
}

export async function deleteAppointment(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('appointments').delete().eq('id', id)
  if (error) throw new Error(`${error.code}: ${error.message}`)
  revalidatePath('/dashboard/appointments')
  revalidatePath('/dashboard/calendar')
}

export type UploadPatientFileState = {
  message?: string | null;
  success?: boolean;
};

const MAX_PATIENT_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_PATIENT_FILE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
]);

export async function uploadPatientFile(
  patientId: string,
  _prevState: UploadPatientFileState,
  formData: FormData,
): Promise<UploadPatientFileState> {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { message: 'Choose a file before uploading.' };
  }
  if (!ALLOWED_PATIENT_FILE_TYPES.has(file.type)) {
    return { message: 'Choose a PNG, JPEG, WebP, or PDF file.' };
  }
  if (file.size > MAX_PATIENT_FILE_SIZE) {
    return { message: 'The file must be 20 MB or smaller.' };
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) {
    console.error('Supabase error while verifying file uploader:', userError);
    return { message: 'Could not verify your account. Please sign in again and retry.' };
  }
  if (!user) {
    return { message: 'You must be signed in to upload a patient file.' };
  }

  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('file_path')
    .eq('id', patientId)
    .maybeSingle()

  if (patientError) {
    console.error('Supabase error while checking patient file access:', patientError);
    return { message: 'Could not verify access to this patient. Refresh the page and try again.' };
  }
  if (!patient) {
    return { message: 'This patient is unavailable or you do not have access to it.' };
  }
  if (patient.file_path) {
    return { message: 'This patient already has a file. Delete it before uploading another.' };
  }

  const path = `${user.id}/${patientId}/${file.name}`
  const { data, error } = await supabase.storage.from('patient-files').upload(path, file)
  if (error) {
    console.error('Supabase Storage error while uploading patient file:', error);
    return { message: `Upload failed: ${error.message}` };
  }

  const { data: updatedPatient, error: updateError } = await supabase
    .from('patients')
    .update({ file_path: data.path })
    .eq('id', patientId)
    .is('file_path', null)
    .select('id')
    .maybeSingle()

  if (updateError) {
    const { error: cleanupError } = await supabase.storage.from('patient-files').remove([data.path]);
    console.error('Supabase error while saving patient file path:', updateError);
    if (cleanupError) {
      console.error('Supabase error while cleaning up failed patient upload:', cleanupError);
      return {
        message: `The file uploaded, but its patient record could not be updated and cleanup failed: ${cleanupError.message}`,
      };
    }
    return { message: `Could not save the uploaded file to this patient: ${updateError.message}` };
  }
  if (!updatedPatient) {
    const { error: cleanupError } = await supabase.storage.from('patient-files').remove([data.path])
    if (cleanupError) {
      console.error('Supabase error while cleaning up duplicate patient upload:', cleanupError);
      return {
        message: `An existing file prevented this upload, and the new file could not be removed: ${cleanupError.message}`,
      };
    }
    revalidatePath(`/dashboard/patients/${patientId}/edit`)
    return { message: 'This patient already has a file. Delete it before uploading another.' };
  }

  revalidatePath(`/dashboard/patients/${patientId}/edit`)
  return { message: 'File uploaded successfully.', success: true };
}

export async function deletePatientFile(patientId: string) {
  const supabase = await createClient();

  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('file_path')
    .eq('id', patientId)
    .single();

  if (patientError) {
    throw new Error(`Database error ${patientError.code}: failed to load patient file.`);
  }

  const filePath = patient?.file_path;

  if (filePath) {
    const { error: storageError } = await supabase.storage.from('patient-files').remove([filePath]);
    if (storageError) {
      throw new Error(storageError.message);
    }
  }

  const { error: updateError } = await supabase
    .from('patients')
    .update({ file_path: null })
    .eq('id', patientId);

  if (updateError) {
    throw new Error(`${updateError.code}: ${updateError.message}`);
  }

  revalidatePath(`/dashboard/patients/${patientId}/edit`);
}

export async function cancelPatientEdit(patientId: string) {
  await deletePatientFile(patientId);
  redirect('/dashboard/patients');
}