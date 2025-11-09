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
    router.push('/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: pathname === '/dashboard',
    },
    {
      name: 'Eventos',
      href: '/dashboard/events',
      icon: Calendar,
      current: pathname.startsWith('/dashboard/events'),
    },
  ];

  return (
    <nav className="bg-white border-b border-[hsl(var(--gray-200))] backdrop-blur-sm bg-white/90 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex justify-between h-20">
          {/* Logo e Menu */}
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="cursor-pointer">
              <h1 className="text-2xl font-bold text-[hsl(var(--accent-pink))] font-sans">
                🏃 Okê Sports
              </h1>
            </Link>

            {/* Menu de Navegação */}
            <div className="hidden md:flex items-center space-x-1">
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
                            : 'text-[hsl(var(--gray-600))] hover:text-[hsl(var(--dark))] hover:bg-[hsl(var(--gray-50))]'
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
          <div className="flex items-center space-x-6">
            <span className="text-sm font-medium text-[hsl(var(--gray-600))] hidden sm:block">
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
