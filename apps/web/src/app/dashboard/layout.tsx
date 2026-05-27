'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, ShoppingCart, Package, BarChart3, Settings, LogOut, Car,
} from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/dashboard/clients', label: 'Клиенты', icon: Users },
  { href: '/dashboard/orders', label: 'Заказы', icon: ShoppingCart },
  { href: '/dashboard/inventory', label: 'Склад', icon: Package },
  { href: '/dashboard/analytics', label: 'Аналитика', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Настройки', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ firstName: string; lastName: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!stored) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-gray-200 bg-white p-4 lg:block dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-zinc-100">Washer CRM</div>
            <div className="text-xs text-gray-500">v0.1</div>
          </div>
        </div>
        <nav className="space-y-1">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                  active
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-800">
            <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-xs text-gray-500">{user.role}</div>
            <button
              onClick={logout}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <LogOut className="h-3 w-3" />
              Выйти
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl p-6">{children}</div>
      </main>
    </div>
  );
}
