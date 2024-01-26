'use client';

import Link from 'next/link';
import { AppHero } from '../ui/ui-layout';
import { usePathname } from 'next/navigation';

const links: { label: string; href: string }[] = [
  { label: 'get started', href: '/onboard' },
  { label: 'discover friends', href: '/discover' },
  { label: 'your content', href: '/content' },
  { label: 'your audience', href: '/audience' },
];

export default function DashboardFeature() {
  const pathname = usePathname();

  return (
    <div>
      <AppHero title="gm" subtitle="read. write. own." />
      <div className="max-w-xl mx-auto py-6 text-center text-lg">
        own your content. own your audience.
      </div>
      <div className="max-w-xl mx-auto py-6 sm:px-6 lg:px-8 text-center">
        <div className="space-y-2">
          {links.map((link, index) => (
            <div key={link.href} className="link">
              <Link
                className={pathname.startsWith(link.href) ? 'active' : ''}
                href={link.href}
              >
                {link.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
