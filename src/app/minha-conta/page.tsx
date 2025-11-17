'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useParticipantAuthStore } from '@/stores/participantAuthStore';
import { ArrowLeft, User, Calendar, LogOut, Loader2 } from 'lucide-react';

interface Registration {
  id: string;
  registrationNumber: number;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  event: {
    name: string;
    slug: string;
    eventDate: string;
    bannerUrl: string | null;
  };
  modality: {
    name: string;
  };
}

export default function MinhaContaPage() {
  const router = useRouter();
  const { participant, accessToken, isAuthenticated, logout } = useParticipantAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchRegistrations();
    }
  }, [isAuthenticated, accessToken]);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch('/api/registrations/my', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRegistrations(data.registrations);
      }
    } catch (error) {
      console.error('Erro ao buscar inscrições:', error);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isHydrated || !participant) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      CONFIRMED: { label: 'Confirmada', variant: 'default' },
      PENDING: { label: 'Pendente', variant: 'secondary' },
      CANCELLED: { label: 'Cancelada', variant: 'destructive' },
    };

    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--gray-100))]">
      {/* Header */}
      <header className="bg-white border-b border-[hsl(var(--gray-200))]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="cursor-pointer">
              <h1 className="text-2xl font-bold text-[hsl(var(--accent-pink))] font-sans">
                🏃 Okê Sports
              </h1>
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-sm text-[hsl(var(--gray-600))] hidden sm:block">
                {participant.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-[hsl(var(--gray-600))] hover:text-[hsl(var(--dark))] mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para home
          </Link>
          <h2 className="text-4xl font-bold text-[hsl(var(--dark))] mb-2 font-sans">
            Minha Conta
          </h2>
          <p className="text-lg text-[hsl(var(--gray-600))]">
            Olá, {participant.fullName}!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card: Meus Dados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Meus Dados
              </CardTitle>
              <CardDescription>Suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--gray-600))]">Nome</p>
                <p className="text-base text-[hsl(var(--dark))]">{participant.fullName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[hsl(var(--gray-600))]">Email</p>
                <p className="text-base text-[hsl(var(--dark))]">{participant.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[hsl(var(--gray-600))]">CPF</p>
                <p className="text-base text-[hsl(var(--dark))]">
                  {participant.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[hsl(var(--gray-600))]">Telefone</p>
                <p className="text-base text-[hsl(var(--dark))]">{participant.phone}</p>
              </div>
              <Button variant="outline" className="w-full mt-4" disabled>
                Editar Dados (Em breve)
              </Button>
            </CardContent>
          </Card>

          {/* Minhas Inscrições - Ocupa 2 colunas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Minhas Inscrições
                </CardTitle>
                <CardDescription>Eventos que você está inscrito</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRegistrations ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--accent-pink))]" />
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-[hsl(var(--gray-400))] mb-4" />
                    <p className="text-sm text-[hsl(var(--gray-600))] mb-4">
                      Você ainda não possui inscrições
                    </p>
                    <Link href="/">
                      <Button variant="outline">
                        Ver Eventos Disponíveis
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {registrations.map((registration) => (
                      <div
                        key={registration.id}
                        className="p-4 border border-[hsl(var(--gray-200))] rounded-lg hover:border-[hsl(var(--accent-pink))] transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-[hsl(var(--dark))]">
                              {registration.event.name}
                            </h3>
                            <p className="text-sm text-[hsl(var(--gray-600))]">
                              {registration.modality.name}
                            </p>
                          </div>
                          {getStatusBadge(registration.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                          <div>
                            <p className="text-[hsl(var(--gray-600))]">Número</p>
                            <p className="font-medium">#{registration.registrationNumber}</p>
                          </div>
                          <div>
                            <p className="text-[hsl(var(--gray-600))]">Data do Evento</p>
                            <p className="font-medium">
                              {new Date(registration.event.eventDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div>
                            <p className="text-[hsl(var(--gray-600))]">Valor</p>
                            <p className="font-medium">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(registration.total)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[hsl(var(--gray-600))]">Inscrito em</p>
                            <p className="font-medium">
                              {new Date(registration.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Link href={`/e/${registration.event.slug}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              Ver Evento
                            </Button>
                          </Link>
                          {registration.status === 'CONFIRMED' && (
                            <Button variant="outline" size="sm" disabled>
                              Baixar Comprovante
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
