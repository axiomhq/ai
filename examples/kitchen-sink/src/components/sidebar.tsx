'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavigationItem = {
  name: string;
  href: string;
};

type SidebarSection = {
  title: string;
  items: NavigationItem[];
};

const sidebarSections: SidebarSection[] = [
  {
    title: 'Sandbox',
    items: [
      {
        name: 'Support agent',
        href: '/support-agent',
      },
    ],
  },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div role="presentation" className="relative">
      <div role="presentation" className="overflow-scroll max-h-screen pt-6 pr-6 pb-24 pl-6">
        {sidebarSections.map((section) => (
          <div key={section.title} className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase">{section.title}</h3>
            <div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    pathname === item.href
                      ? 'py-[0.3125rem] px-3 bg-gray-50 outline outline-1 outline-gray-200 outline-offset-[-1px] cursor-default border-none font-medium text-sm block rounded-[6px]'
                      : 'py-1 px-3 rounded-[6px] select-none border-y border-transparent flex flex-grow items-center gap-1 text-sm text-gray-700 hover:text-gray-900'
                  }
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
