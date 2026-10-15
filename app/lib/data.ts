import postgres from 'postgres';
import {
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';
import { createClient } from './supabase/server';
import { fetchVisiblePatientIds } from './patient-access';

const globalForSql = globalThis as unknown as {
  sql: ReturnType<typeof postgres> | undefined;
};

const sql =
  globalForSql.sql ??
  postgres(process.env.POSTGRES_URL!, {
    ssl: 'require',
    prepare: false,
    max: 5,    // maximum number of connections in the pool
  });

if (process.env.NODE_ENV !== 'production') globalForSql.sql = sql;

const UUID_ARRAY_OID = 2951;

export async function fetchRevenue() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("revenue").select("month, revenue")
  
  if (error) throw new Error(error.message)
  
  const order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return data?.sort((a, b) => order.indexOf(a.month) - order.indexOf(b.month))
  
}

export async function fetchLatestInvoices() {
  const patientIds = await fetchVisiblePatientIds();
  if (patientIds.length === 0) return [];

  try {
    const data = await sql<LatestInvoiceRaw[]>`
      SELECT invoices.amount, patients.full_name AS patient_name, patients.phone, invoices.id
      FROM invoices
      JOIN patients ON invoices.patient_id = patients.id
      WHERE invoices.patient_id = ANY(${sql.array(patientIds, UUID_ARRAY_OID)}::uuid[])
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  const patientIds = await fetchVisiblePatientIds();
  if (patientIds.length === 0) {
    return {
      numberOfPatients: 0,
      numberOfInvoices: 0,
      totalPaidInvoices: formatCurrency(0),
      totalPendingInvoices: formatCurrency(0),
    };
  }

  try {
    const [data] = await sql`
      SELECT
        COUNT(*) AS invoice_count,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending
      FROM invoices
      WHERE patient_id = ANY(${sql.array(patientIds, UUID_ARRAY_OID)}::uuid[])
    `;

    return {
      numberOfPatients: patientIds.length,
      numberOfInvoices: Number(data.invoice_count ?? '0'),
      totalPaidInvoices: formatCurrency(data.paid ?? '0'),
      totalPendingInvoices: formatCurrency(data.pending ?? '0'),
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

export const ITEMS_PER_PAGE = 10;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const patientIds = await fetchVisiblePatientIds();
  if (patientIds.length === 0) return [];

  try {
    const invoices = await sql<InvoicesTable[]>`
      SELECT
        invoices.id,
        invoices.patient_id,
        invoices.amount,
        invoices.date,
        invoices.status,
        patients.full_name AS patient_name,
        patients.phone
      FROM invoices
      JOIN patients ON invoices.patient_id = patients.id
      WHERE invoices.patient_id = ANY(${sql.array(patientIds, UUID_ARRAY_OID)}::uuid[])
        AND (
          patients.full_name ILIKE ${`%${query}%`} OR
          patients.phone ILIKE ${`%${query}%`} OR
          invoices.amount::text ILIKE ${`%${query}%`} OR
          invoices.date::text ILIKE ${`%${query}%`} OR
          invoices.status ILIKE ${`%${query}%`}
        )
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  const patientIds = await fetchVisiblePatientIds();
  if (patientIds.length === 0) return 0;

  try {
    const data = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN patients ON invoices.patient_id = patients.id
    WHERE invoices.patient_id = ANY(${sql.array(patientIds, UUID_ARRAY_OID)}::uuid[])
      AND (
        patients.full_name ILIKE ${`%${query}%`} OR
        patients.phone ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      )
  `;

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  const patientIds = await fetchVisiblePatientIds();
  if (patientIds.length === 0) return undefined;

  try {
    const data = await sql<InvoiceForm[]>`
      SELECT
        invoices.id,
        invoices.patient_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id}
        AND invoices.patient_id = ANY(${sql.array(patientIds, UUID_ARRAY_OID)}::uuid[]);
    `;

    const invoice = data.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export type Patient = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  date_of_birth: string | null;
  created_at: string;
  file_path: string | null;
};

function ilikeSearchPattern(query: string): string {
  return `"%${query.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}%"`
}

function ilikeValuePattern(query: string): string {
  return `%${query}%`
}

function patientSearchFilter(query: string): string {
  const pattern = ilikeSearchPattern(query)
  const filters = [`full_name.ilike.${pattern}`, `phone.ilike.${pattern}`]
  const date = new Date(`${query}T00:00:00.000Z`)
  if (/^\d{4}-\d{2}-\d{2}$/.test(query) && date.toISOString().slice(0, 10) === query) {
    filters.push(`date_of_birth.eq.${query}`)
  }
  return filters.join(',')
}

export async function fetchPatients(): Promise<Patient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patients')
    .select('id, user_id, full_name, phone, date_of_birth, created_at, file_path')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch patients.');
  }
  return data as Patient[];
}

export async function fetchPatientsPage(currentPage: number): Promise<Patient[]> {
  return fetchFilteredPatientsPage('', currentPage);
}

export async function fetchFilteredPatientsPage(
  query: string,
  currentPage: number,
): Promise<Patient[]> {
  const supabase = await createClient();
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  let request = supabase
    .from('patients')
    .select('id, user_id, full_name, phone, date_of_birth, created_at, file_path')
  if (query) {
    request = request.or(patientSearchFilter(query));
  }
  const { data, error } = await request
    .order('created_at', { ascending: false })
    .range(from, from + ITEMS_PER_PAGE - 1);

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch patients.');
  }
  return data as Patient[];
}

export async function fetchPatientsPages(query = ''): Promise<number> {
  const supabase = await createClient();
  let request = supabase
    .from('patients')
    .select('id', { count: 'exact', head: true });
  if (query) {
    request = request.or(patientSearchFilter(query));
  }
  const { count, error } = await request;

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch total number of patients.');
  }
  return Math.ceil((count ?? 0) / ITEMS_PER_PAGE);
}

export async function fetchPatientById(id: string): Promise<Patient | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('patients')
    .select('id, user_id, full_name, phone, date_of_birth, created_at, file_path')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch patient.');
  }
  return (data as Patient | null) ?? null;
}

export interface AppointmentRow {
  id: string
  patient_id: string
  starts_at: string
  status: 'booked' | 'done' | 'no_show'
  patient_name: string | null
}

export async function fetchAppointments(): Promise<AppointmentRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('appointments')
    .select('id, patient_id, starts_at, status')
    .order('starts_at', { ascending: false })
  if (error) throw new Error(error.message)

  const patientIds = [...new Set(data.map((appointment) => appointment.patient_id))]
  const patientNames = new Map<string, string>()

  if (patientIds.length > 0) {
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name')
      .in('id', patientIds)
    if (patientsError) throw new Error(patientsError.message)
    for (const patient of patients) {
      patientNames.set(patient.id, patient.full_name)
    }
  }

  return data.map((appointment) => ({
    ...appointment,
    patient_name: patientNames.get(appointment.patient_id) ?? null,
  }))
}

export async function fetchAppointmentsPage(currentPage: number): Promise<AppointmentRow[]> {
  return fetchFilteredAppointmentsPage('', currentPage);
}

async function fetchPatientIdsByName(query: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patients')
    .select('id')
    .ilike('full_name', ilikeValuePattern(query))
  if (error) throw new Error(error.message)
  return data.map((patient) => patient.id)
}

export async function fetchFilteredAppointmentsPage(
  query: string,
  currentPage: number,
): Promise<AppointmentRow[]> {
  const supabase = await createClient()
  const from = (currentPage - 1) * ITEMS_PER_PAGE
  let request = supabase
    .from('appointments')
    .select('id, patient_id, starts_at, status')
  if (query) {
    const patientIds = await fetchPatientIdsByName(query)
    if (patientIds.length === 0) return []
    request = request.in('patient_id', patientIds)
  }
  const { data, error } = await request
    .order('starts_at', { ascending: false })
    .range(from, from + ITEMS_PER_PAGE - 1)
  if (error) throw new Error(error.message)

  const patientIds = [...new Set(data.map((appointment) => appointment.patient_id))]
  const patientNames = new Map<string, string>()

  if (patientIds.length > 0) {
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name')
      .in('id', patientIds)
    if (patientsError) throw new Error(patientsError.message)
    for (const patient of patients) {
      patientNames.set(patient.id, patient.full_name)
    }
  }

  return data.map((appointment) => ({
    ...appointment,
    patient_name: patientNames.get(appointment.patient_id) ?? null,
  }))
}

export async function fetchAppointmentsPages(query = ''): Promise<number> {
  const supabase = await createClient()
  let request = supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
  if (query) {
    const patientIds = await fetchPatientIdsByName(query)
    if (patientIds.length === 0) return 0
    request = request.in('patient_id', patientIds)
  }
  const { count, error } = await request
  if (error) throw new Error(error.message)
  return Math.ceil((count ?? 0) / ITEMS_PER_PAGE)
}

export async function fetchPatientOptions(): Promise<{ id: string; full_name: string }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('patients').select('id, full_name').order('full_name')
  if (error) throw new Error(error.message)
  return data
}

export async function fetchAppointmentById(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('appointments')
    .select('id, patient_id, starts_at, status')
    .eq('id', id)
    .single()
  return data
}

export interface StatusRow {
  status: 'booked' | 'done' | 'no_show'
  total: number
}

export async function fetchAppointmentStatusThisMonth(): Promise<StatusRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('appointment_status_this_month').select('status, total')
  if (error) throw new Error(error.message)
  return data as StatusRow[]
}

export interface perMonth {
  month_start: string;
  label: string;
  new_patients: number;
}

export async function fetchPatientsPerMonth(): Promise<perMonth[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patients_per_month')
    .select('month_start, label, new_patients')
    .order('month_start', { ascending: true })
  if (error) throw new Error(error.message)
  return data as perMonth[]
}