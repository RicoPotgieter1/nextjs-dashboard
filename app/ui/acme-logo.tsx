import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';

export default function AcmeLogo({
  size = 'default',
}: {
  size?: 'default' | 'large' | 'compact';
}) {
  const iconSize =
    size === 'large' ? 'h-14 w-14' : size === 'compact' ? 'h-10 w-10' : 'h-13 w-13';
  const textSize =
    size === 'large' ? 'whitespace-nowrap text-[52px]' : size === 'compact' ? 'text-[32px]' : 'text-[44px]';

  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <GlobeAltIcon className={`${iconSize} pr-3 rotate-[15deg]`} />
      <p className={textSize}>Clinic Care</p>
    </div>
  );
}
