import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';

export default function AcmeLogo() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <GlobeAltIcon className="h-13 w-13 pr-3 rotate-[15deg]" />
      <p className="text-[44px]">Clinic Care</p>
    </div>
  );
}
