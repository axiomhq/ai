import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next.js with Vercel AI SDK v7 telemetry',
  description: 'Next.js with Vercel AI SDK v7 OpenTelemetry',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
