import Form from '@/app/ui/patients/create-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add Patient',
};

export default function Page() {
  return (
    <main>
      <h1 className="mb-6 text-2xl">Add patient</h1>
      <Form />
    </main>
  );
}