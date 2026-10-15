import postgres from 'postgres';
import { fetchVisiblePatientIds } from '@/app/lib/patient-access';

const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: 'require',
  prepare: false,
});
const UUID_ARRAY_OID = 2951;

async function listInvoices(patientIds: string[]) {
  if (patientIds.length === 0) return [];

	const data = await sql`
    SELECT invoices.amount, patients.full_name
    FROM invoices
    LEFT JOIN patients ON invoices.patient_id = patients.id
    WHERE invoices.amount = 666
      AND invoices.patient_id = ANY(${sql.array(patientIds, UUID_ARRAY_OID)}::uuid[]);
  `;

	return data;
}

export async function GET() {
  try {
    const patientIds = await fetchVisiblePatientIds();
    return Response.json(await listInvoices(patientIds));
  } catch (error) {
  	return Response.json({ error }, { status: 500 });
  }
}
