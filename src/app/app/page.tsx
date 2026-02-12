'use client';

import { useEffect, useState, useCallback } from 'react';
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
    mercadoPagoFee?: number;
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
  const [mpStatus, setMpStatus] = useState<{ connected: boolean; checking: boolean }>({
    connected: false,
    checking: true,
  });

  const checkMercadoPagoStatus = useCallback(async () => {
    if (!accessToken) return;

    try {
      setMpStatus({ connected: false, checking: true });
      const response = await fetch('/api/auth/mercadopago/status', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      // Atualizar status real
      setMpStatus({ connected: data.connected === true, checking: false });

      // Se o status real difere do status no store, atualizar o store
      if (user && data.connected !== user.mpConnected) {
        useAuthStore.setState({
          user: {
            ...user,
            mpConnected: data.connected === true,
          },
        });
      }
    } catch (error) {
      console.error('Erro ao verificar status do Mercado Pago:', error);
      setMpStatus({ connected: false, checking: false });
      // Se houver erro e o usuário está marcado como conectado, desmarcar
      if (user && user.mpConnected) {
        useAuthStore.setState({
          user: {
            ...user,
            mpConnected: false,
          },
        });
      }
    }
  }, [accessToken, user]);

  const fetchStats = useCallback(async () => {
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
  }, [router]);

  useEffect(() => {
    // Aguardar hidratação do Zustand
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Buscar estatísticas quando autenticado
    if (isHydrated && user && accessToken) {
      fetchStats();
      checkMercadoPagoStatus();
    }
  }, [isHydrated, user, accessToken, fetchStats, checkMercadoPagoStatus]);

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
            // Verificar status real após conectar
            checkMercadoPagoStatus();
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
          },
        });
        setMpStatus({ connected: false, checking: false });
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        <div className="mb-10 space-y-3 sm:mb-12">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs tracking-wide">
            Painel de gestão
          </Badge>
          <h2 className="text-3xl font-bold text-[hsl(var(--dark))] sm:text-4xl font-sans">
            Dashboard
          </h2>
          <p className="max-w-2xl text-base text-[hsl(var(--gray-700))] sm:text-lg">
            Bem-vindo, {user.fullName}! Confira seus eventos, pagamentos e indicadores em um só
            lugar.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle>Mercado Pago</CardTitle>
              <CardDescription>
                {mpStatus.connected
                  ? 'Sua conta está conectada'
                  : 'Conecte sua conta para receber pagamentos'}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              {mpStatus.checking ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-[hsl(var(--gray-700))]">Verificando...</span>
                </div>
              ) : mpStatus.connected ? (
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

          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle>Meus Eventos</CardTitle>
              <CardDescription>Gerencie seus eventos esportivos</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Link href="/app/events">
                <Button variant="outline" className="w-full">
                  Ver Eventos
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle>Inscrições</CardTitle>
              <CardDescription>Acompanhe as inscrições dos seus eventos</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button variant="outline" className="w-full" disabled>
                Ver Inscrições (Em breve)
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10 sm:mt-12">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h3 className="text-xl font-semibold text-[hsl(var(--dark))] font-sans">
              Indicadores rápidos
            </h3>
            <span className="text-xs text-[hsl(var(--gray-700))]">Atualização automática</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="min-h-[108px] text-center">
                  {isLoadingStats ? (
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-[hsl(var(--accent-pink))]" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-[hsl(var(--dark))] tabular-nums">
                        {stats?.events.active ?? 0}
                      </p>
                      <p className="mt-1 text-sm text-[hsl(var(--gray-700))]">Eventos Ativos</p>
                      <p className="mt-1 text-xs text-[hsl(var(--gray-700))]">
                        {stats?.events.total ?? 0} total • {stats?.events.draft ?? 0} rascunhos
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="min-h-[108px] text-center">
                  {isLoadingStats ? (
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-[hsl(var(--accent-pink))]" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-[hsl(var(--dark))] tabular-nums">
                        {stats?.registrations.total ?? 0}
                      </p>
                      <p className="mt-1 text-sm text-[hsl(var(--gray-700))]">Inscrições</p>
                      <p className="mt-1 text-xs text-[hsl(var(--gray-700))]">
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
                <div className="min-h-[108px] text-center">
                  {isLoadingStats ? (
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-[hsl(var(--accent-pink))]" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-[hsl(var(--accent-pink))] tabular-nums">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(stats?.revenue.net ?? 0)}
                      </p>
                      <p className="mt-1 text-sm text-[hsl(var(--gray-700))]">Receita Líquida</p>
                      <p className="mt-1 text-xs text-[hsl(var(--gray-700))]">
                        Bruta:{' '}
                        {new Intl.NumberFormat('pt-BR', {
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
                <div className="min-h-[108px] text-center">
                  {isLoadingStats ? (
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-[hsl(var(--accent-pink))]" />
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-[hsl(var(--gray-800))] tabular-nums">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(stats?.revenue.mercadoPagoFee ?? stats?.revenue.platformFee ?? 0)}
                      </p>
                      <p className="mt-1 text-sm text-[hsl(var(--gray-700))]">Taxa Mercado Pago</p>
                      <p className="mt-1 text-xs text-[hsl(var(--gray-700))]">
                        {stats?.registrations.recent ?? 0} inscrições nos últimos 7 dias
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-10 sm:mt-12">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-[hsl(var(--dark))] font-sans">Alertas</h3>
            <p className="text-sm text-[hsl(var(--gray-700))]">
              Avisos importantes para acompanhamento da operação.
            </p>
          </div>
          {stats && stats.alerts.length > 0 ? (
            <div className="space-y-3">
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
          ) : (
            <Card>
              <CardContent className="py-6">
                <p className="text-sm text-[hsl(var(--gray-700))]">Nenhum alerta no momento.</p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
