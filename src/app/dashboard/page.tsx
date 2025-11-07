'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';

export default function DashboardPage() {
  const router = useRouter();
  const { user, accessToken, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Verificar se está autenticado
    if (!user || !accessToken) {
      router.push('/login');
    }
  }, [user, accessToken, router]);

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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">🏃 Okê Sports</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="mt-2 text-gray-600">Bem-vindo, {user.fullName}!</p>
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
              <Button variant="outline" className="w-full" disabled>
                Ver Eventos (Em breve)
              </Button>
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
                <p className="text-3xl font-bold text-primary">0</p>
                <p className="text-sm text-gray-600 mt-1">Eventos Ativos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">0</p>
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
