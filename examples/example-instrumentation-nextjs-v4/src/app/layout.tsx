import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next.js with OpenTelemetry',
  description: 'Next.js with OpenTelemetry',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <h1>Next.js with Vercel AI SDK v4 and @axiomhq/ai</h1>
        {children}
      </body>
    </html>
  );
}
