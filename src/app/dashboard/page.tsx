'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';

export default function DashboardPage() {
  const router = useRouter();
  const { user, accessToken, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Aguardar hidratação do Zustand
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Verificar se está autenticado apenas após hidratação
    if (isHydrated && (!user || !accessToken)) {
      router.push('/login');
    }
  }, [user, accessToken, router, isHydrated]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleConnectMP = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/mercadopago/authorize', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.authUrl) {
        // Redirecionar para autorização do Mercado Pago
        window.location.href = result.authUrl;
      } else {
        alert('Erro ao conectar Mercado Pago');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao conectar Mercado Pago');
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading enquanto hidrata
  if (!isHydrated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--gray-100))]">
      {/* Navbar com estilo Dribbble */}
      <nav className="bg-white border-b border-[hsl(var(--gray-200))] backdrop-blur-sm bg-white/90 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-[hsl(var(--accent-pink))] font-sans">🏃 Okê Sports</h1>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-sm font-medium text-[hsl(var(--gray-600))]">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content com espaçamento Dribbble */}
      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-[hsl(var(--dark))] mb-2 font-sans">Dashboard</h2>
          <p className="text-lg text-[hsl(var(--gray-600))]">Bem-vindo, {user.fullName}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card: Mercado Pago */}
          <Card>
            <CardHeader>
              <CardTitle>Mercado Pago</CardTitle>
              <CardDescription>
                {user.mpConnected
                  ? 'Sua conta está conectada'
                  : 'Conecte sua conta para receber pagamentos'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.mpConnected ? (
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">Conectado</span>
                </div>
              ) : (
                <Button onClick={handleConnectMP} disabled={isLoading} className="w-full">
                  {isLoading ? 'Conectando...' : 'Conectar Mercado Pago'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Card: Eventos */}
          <Card>
            <CardHeader>
              <CardTitle>Meus Eventos</CardTitle>
              <CardDescription>Gerencie seus eventos esportivos</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/events">
                <Button variant="outline" className="w-full">
                  Ver Eventos
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card: Inscrições */}
          <Card>
            <CardHeader>
              <CardTitle>Inscrições</CardTitle>
              <CardDescription>Acompanhe as inscrições dos seus eventos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Ver Inscrições (Em breve)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[hsl(var(--dark))]">0</p>
                <p className="text-sm text-gray-600 mt-1">Eventos Ativos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[hsl(var(--dark))]">0</p>
                <p className="text-sm text-gray-600 mt-1">Inscrições</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-secondary">R$ 0,00</p>
                <p className="text-sm text-gray-600 mt-1">Receita Total</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-secondary">R$ 0,00</p>
                <p className="text-sm text-gray-600 mt-1">Taxa Plataforma</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
