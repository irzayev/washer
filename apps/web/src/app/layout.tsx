import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Washer CRM',
  description: 'eDetailing CRM for car wash & detailing centers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
