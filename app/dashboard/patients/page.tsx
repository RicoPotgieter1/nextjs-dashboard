import { fetchFilteredPatientsPage, fetchPatientsPages } from '@/app/lib/data';
import { CreatePatient, UpdatePatient, DeletePatient } from '@/app/ui/patients/buttons';
import { lusitana } from '@/app/ui/fonts';
import { RefreshOnChange } from '@/app/ui/refresh-on-change';
import Pagination from '@/app/ui/invoices/pagination';
import Search from '@/app/ui/search';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Patients',
};

export default async function Page(props: {
  searchParams?: Promise<{ page?: string; query?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const totalPages = await fetchPatientsPages(query);
  const requestedPage = Math.max(1, Number(searchParams?.page) || 1);
  const currentPage = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);
  const patients = await fetchFilteredPatientsPage(query, currentPage);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Patients</h1>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search patients..." />
        <CreatePatient />
      </div>

      <RefreshOnChange table="patients" />
      {patients.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">
          {query ? 'No patients match your search.' : 'No patients yet. Add the first one.'}
        </p>
      ) : (
        <div className="mt-6 flow-root">
          <div className="inline-block min-w-full align-middle">
            <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
              <div className="md:hidden">
                {patients.map((patient) => (
                  <article key={patient.id} className="mb-2 w-full rounded-md bg-white p-4 last:mb-0">
                    <div className="border-b border-gray-100 pb-4">
                      <p className="font-medium text-gray-900">{patient.full_name}</p>
                      <p className="mt-1 text-sm text-gray-500">{patient.phone ?? 'No phone number'}</p>
                    </div>
                    <div className="flex items-start justify-between gap-3 pt-4">
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600">Date of birth: {patient.date_of_birth ?? '—'}</p>
                        {patient.file_path ? (
                          <a
                            href={`/dashboard/patients/${patient.id}/file`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            {patient.file_path.split('/').pop() ?? 'Open document'}
                          </a>
                        ) : (
                          <p className="text-gray-500">No document</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <UpdatePatient id={patient.id} />
                        <DeletePatient id={patient.id} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <table className="hidden min-w-full text-gray-900 md:table">
                <thead className="rounded-lg text-left text-sm font-normal">
                  <tr>
                    <th scope="col" className="px-4 py-5 font-medium sm:pl-6">Full name</th>
                    <th scope="col" className="px-3 py-5 font-medium">Phone</th>
                    <th scope="col" className="px-3 py-5 font-medium">Date of birth</th>
                    <th scope="col" className="px-3 py-5 font-medium">Docs</th>
                    <th scope="col" className="relative py-3 pl-6 pr-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {patients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                    >
                      <td className="whitespace-nowrap py-3 pl-6 pr-3 font-medium">{patient.full_name}</td>
                      <td className="whitespace-nowrap px-3 py-3">{patient.phone ?? ''}</td>
                      <td className="whitespace-nowrap px-3 py-3">{patient.date_of_birth ?? ''}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {patient.file_path ? (
                          <a
                            href={`/dashboard/patients/${patient.id}/file`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            {patient.file_path.split('/').pop() ?? 'Open document'}
                          </a>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap py-3 pl-6 pr-3">
                        <div className="flex justify-end gap-3">
                          <UpdatePatient id={patient.id} />
                          <DeletePatient id={patient.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex w-full justify-center">
          <Pagination totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}
