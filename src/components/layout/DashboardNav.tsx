'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { LayoutDashboard, Calendar } from 'lucide-react';

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/app/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/app',
      icon: LayoutDashboard,
      current: pathname === '/app',
    },
    {
      name: 'Eventos',
      href: '/app/events',
      icon: Calendar,
      current: pathname.startsWith('/app/events'),
    },
  ];

  return (
    <nav className="border-b border-[hsl(var(--gray-200))] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex h-20 justify-between gap-4">
          {/* Logo e Menu */}
          <div className="flex items-center gap-5 sm:gap-8">
            <Link href="/app" className="cursor-pointer">
              <h1 className="text-2xl font-bold text-[hsl(var(--accent-pink))] font-sans">
                🏃 Okê Sports
              </h1>
            </Link>

            {/* Menu de Navegação */}
            <div className="hidden items-center space-x-1 md:flex">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <button
                      className={`
                        inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer
                        ${
                          item.current
                            ? 'bg-[hsl(var(--gray-100))] text-[hsl(var(--dark))]'
                            : 'text-[hsl(var(--gray-700))] hover:text-[hsl(var(--dark))] hover:bg-[hsl(var(--gray-50))]'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Info e Logout */}
          <div className="flex items-center gap-3 sm:gap-6">
            <span className="hidden text-sm font-medium text-[hsl(var(--gray-700))] sm:block">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
