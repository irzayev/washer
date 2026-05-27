import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Личный кабинет — Washer',
  description: 'Кабинет клиента автомойки',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
