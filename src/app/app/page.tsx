'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { apiGet, ApiError } from '@/lib/api';
import { Loader2, AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface DashboardStats {
  events: {
    total: number;
    active: number;
    draft: number;
  };
  registrations: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    recent: number;
  };
  revenue: {
    total: number;
    platformFee: number;
    net: number;
  };
  upcomingEvent: {
    id: string;
    name: string;
    eventDate: string;
    registrations: number;
  } | null;
  alerts: Array<{
    type: 'warning' | 'info' | 'success' | 'error';
    message: string;
    action?: { label: string; href: string };
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, accessToken, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    // Aguardar hidratação do Zustand
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Buscar estatísticas quando autenticado
    if (isHydrated && user && accessToken) {
      fetchStats();
    }
  }, [isHydrated, user, accessToken]);

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const data = await apiGet<DashboardStats>('/api/dashboard/stats');
      setStats(data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push('/app/login');
      } else {
        console.error('Erro ao buscar estatísticas:', error);
        if (error instanceof ApiError) {
          console.error('Status:', error.status);
          console.error('Mensagem:', error.message);
          console.error('Dados completos:', JSON.stringify(error.data, null, 2));
        } else {
          console.error('Erro não é ApiError:', error);
        }
      }
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    // Verificar se está autenticado apenas após hidratação
    if (isHydrated && (!user || !accessToken)) {
      router.push('/app/login');
    }
  }, [user, accessToken, router, isHydrated]);

  useEffect(() => {
    // Verificar se voltou do callback do Mercado Pago
    if (isHydrated && user && accessToken) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mp_connected') === 'true') {
        // Atualizar dados do usuário
        fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
          .then((res) => res.json())
          .then((data) => {
            useAuthStore.setState({ user: data.user });
          })
          .catch((err) => console.error('Erro ao atualizar usuário:', err));

        // Limpar parâmetros da URL
        window.history.replaceState({}, '', '/app');
      }
    }
  }, [isHydrated, user, accessToken]);

  const handleLogout = () => {
    logout();
    router.push('/app/login');
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

  const handleDisconnectMP = async () => {
    if (!confirm('Tem certeza que deseja desconectar sua conta do Mercado Pago?')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/mercadopago/disconnect', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        // Atualizar estado local imediatamente
        useAuthStore.setState({
          user: {
            ...user!,
            mpConnected: false,
            mpUserId: null,
          },
        });
        alert('Mercado Pago desconectado com sucesso!');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao desconectar Mercado Pago');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao desconectar Mercado Pago');
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
      <DashboardNav />

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
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700">Conectado</span>
                  </div>
                  <Button
                    onClick={handleDisconnectMP}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    {isLoading ? 'Desconectando...' : 'Desconectar'}
                  </Button>
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
              <Link href="/app/events">
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

        {/* Alertas */}
        {stats && stats.alerts.length > 0 && (
          <div className="mt-8 space-y-3">
            {stats.alerts.map((alert, index) => {
              const Icon =
                alert.type === 'warning'
                  ? AlertTriangle
                  : alert.type === 'error'
                    ? AlertTriangle
                    : alert.type === 'success'
                      ? CheckCircle
                      : Info;
              const bgColor =
                alert.type === 'warning'
                  ? 'bg-amber-50 border-amber-200'
                  : alert.type === 'error'
                    ? 'bg-red-50 border-red-200'
                    : alert.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-blue-50 border-blue-200';
              const textColor =
                alert.type === 'warning'
                  ? 'text-amber-800'
                  : alert.type === 'error'
                    ? 'text-red-800'
                    : alert.type === 'success'
                      ? 'text-emerald-800'
                      : 'text-blue-800';

              return (
                <div key={index} className={`rounded-xl border p-4 ${bgColor} ${textColor}`}>
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      {alert.action && (
                        <Link href={alert.action.href} className="mt-2 inline-block">
                          <Button variant="outline" size="sm" className="text-xs">
                            {alert.action.label}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                {isLoadingStats ? (
                  <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--accent-pink))] mx-auto" />
                ) : (
                  <>
                    <p className="text-3xl font-bold text-[hsl(var(--dark))]">
                      {stats?.events.active ?? 0}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Eventos Ativos</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats?.events.total ?? 0} total • {stats?.events.draft ?? 0} rascunhos
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                {isLoadingStats ? (
                  <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--accent-pink))] mx-auto" />
                ) : (
                  <>
                    <p className="text-3xl font-bold text-[hsl(var(--dark))]">
                      {stats?.registrations.total ?? 0}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Inscrições</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats?.registrations.confirmed ?? 0} confirmadas •{' '}
                      {stats?.registrations.pending ?? 0} pendentes
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                {isLoadingStats ? (
                  <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--accent-pink))] mx-auto" />
                ) : (
                  <>
                    <p className="text-3xl font-bold text-[hsl(var(--accent-pink))]">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(stats?.revenue.net ?? 0)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Receita Líquida</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Bruta: {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(stats?.revenue.total ?? 0)}
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                {isLoadingStats ? (
                  <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--accent-pink))] mx-auto" />
                ) : (
                  <>
                    <p className="text-3xl font-bold text-[hsl(var(--gray-600))]">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(stats?.revenue.mercadoPagoFee ?? 0)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Taxa Mercado Pago</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats?.registrations.recent ?? 0} inscrições nos últimos 7 dias
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
