import type React from 'react';
import { Sidebar } from '@/components/sidebar';
import { TelemetryProvider } from '@/components/telemetry-context';
import { TelemetryPanel } from '@/components/telemetry-panel';

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="RootLayout"
      className="relative px-12 before:content-[''] before:absolute before:bg-gray-200 before:h-px before:left-0 before:right-0 before:top-[var(--header-height)] before:mt-[-1px] after:content-[''] after:absolute after:bg-gray-200 after:h-px after:left-0 after:right-0 after:bottom-[var(--header-height)] after:mb-[-1px]"
    >
      <div
        id="RootLayoutContainer"
        className="relative flex flex-col min-h-[100dvh] mx-auto max-w-[83rem] pt-[var(--header-height)] pb-0 before:content-[''] before:absolute before:top-0 before:bottom-0 before:w-px before:bg-gray-200 before:left-0 before:ml-[-1px] after:content-[''] after:absolute after:top-0 after:bottom-0 after:w-px after:bg-gray-200 after:right-0 after:mr-[-1px]"
      >
        <div id="RootLayoutContent" className="flex flex-col flex-grow bg-white">
          <div
            id="ContentLayoutRoot"
            className="grid items-start pt-0 px-0 grid-cols-[var(--sidebar-width)_1fr_var(--sidebar-width)]"
          >
            <div
              id="Header"
              className="absolute top-0 left-0 w-full h-[var(--header-height)]"
            ></div>
            <nav
              id="MainNavigation"
              aria-label="Main navigation"
              className="block sticky top-0 mr-[1.875rem]"
            >
              <Sidebar />
            </nav>
            <TelemetryProvider>
              <main id="ContentLayoutMain" className="min-w-0 max-w-3xl w-full pt-8 pb-32">
                <nav
                  id="QuickNavRoot"
                  className="float-right contain-layout w-0 sticky z-[1] block"
                >
                  <div
                    id="QuickNavInner"
                    className="left-8 w-[calc(var(--sidebar-width)-2rem*2)] pb-10 relative"
                  >
                    <TelemetryPanel />
                  </div>
                </nav>
                {children}
              </main>
            </TelemetryProvider>
          </div>
        </div>
        <div
          id="RootLayoutFooter"
          className="absolute bottom-0 left-0 right-0 w-full h-[var(--header-height)] bg-gray-50"
        ></div>
      </div>
    </div>
  );
}
