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
  shirtSize?: string | null;
  buyerId?: string | null;
  paymentId?: string | null;
  eventId: string;
  participantId: string;
  participant?: {
    fullName: string;
    cpf: string;
  };
  event: {
    name: string;
    slug: string;
    eventDate: string;
    bannerUrl: string | null;
  };
  modality: {
    id: string;
    name: string;
  };
}

interface RegistrationGroup {
  id: string; // ID do grupo (pode ser o paymentId ou buyerId + eventId + createdAt)
  event: Registration['event'];
  registrations: Registration[];
  total: number;
  createdAt: string;
  status: string;
  paymentStatus: string;
}

export default function MinhaContaPage() {
  const router = useRouter();
  const { participant, accessToken, isAuthenticated, logout } = useParticipantAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  const [editingShirtSize, setEditingShirtSize] = useState<{ registrationId: string; shirtSize: string | null } | null>(null);
  const [updatingShirtSize, setUpdatingShirtSize] = useState(false);
  const [cancellingRegistrationId, setCancellingRegistrationId] = useState<string | null>(null);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);

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

  // Função para agrupar inscrições que foram feitas juntas (mesmo checkout/pedido)
  const groupRegistrations = (regs: Registration[]): RegistrationGroup[] => {
    const groups = new Map<string, Registration[]>();
    
    // Agrupar inscrições por PEDIDO (checkout), não por evento
    // 1. Se tem paymentId: usar apenas o prefixo (antes do _) - identifica o pedido único
    // 2. Se não tem paymentId: usar buyerId + createdAt (tolerância de 1 minuto)
    regs.forEach((reg) => {
      let groupKey: string;
      
      if (reg.paymentId) {
        // Extrair parte comum do paymentId (tudo exceto a última parte que é o reg.id)
        // Exemplo: "mock_1234567890_reg1" -> prefixo "mock_1234567890"
        // Exemplo: "preference123_reg1" -> prefixo "preference123"
        // Todas as inscrições do mesmo checkout compartilham o mesmo prefixo
        const parts = reg.paymentId.split('_');
        const paymentPrefix = parts.slice(0, -1).join('_'); // Remove a última parte (reg.id)
        groupKey = `payment_${paymentPrefix}`;
      } else {
        // Agrupar por buyerId + createdAt (tolerância de 1 minuto)
        // Isso agrupa inscrições criadas juntas pelo mesmo comprador (mesmo pedido)
        const createdAtDate = new Date(reg.createdAt);
        // Arredondar para o minuto (sem segundos) para agrupar inscrições criadas no mesmo minuto
        const roundedDate = new Date(createdAtDate);
        roundedDate.setSeconds(0, 0);
        roundedDate.setMilliseconds(0);
        
        // Usar buyerId se disponível, senão usar participantId (para inscrições antigas)
        const buyerId = reg.buyerId || reg.participantId;
        groupKey = `order_${buyerId}_${roundedDate.toISOString()}`;
      }
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(reg);
    });
    
    // Converter map para array de grupos
    return Array.from(groups.entries()).map(([key, registrations]) => {
      // Ordenar inscrições dentro do grupo por registrationNumber
      registrations.sort((a, b) => a.registrationNumber - b.registrationNumber);
      
      // Calcular total do grupo
      const total = registrations.reduce((sum, reg) => sum + Number(reg.total), 0);
      
      // Status do grupo (se todas estão no mesmo status, usar esse; senão, usar o mais crítico)
      const statuses = registrations.map((r) => r.status);
      const uniqueStatuses = [...new Set(statuses)];
      let groupStatus = uniqueStatuses[0];
      if (uniqueStatuses.includes('CANCELLED')) {
        groupStatus = 'CANCELLED';
      } else if (uniqueStatuses.includes('PENDING')) {
        groupStatus = 'PENDING';
      }
      
      // PaymentStatus do grupo
      const paymentStatuses = registrations.map((r) => r.paymentStatus);
      const uniquePaymentStatuses = [...new Set(paymentStatuses)];
      let groupPaymentStatus = uniquePaymentStatuses[0];
      if (uniquePaymentStatuses.includes('CANCELLED')) {
        groupPaymentStatus = 'CANCELLED';
      } else if (uniquePaymentStatuses.includes('REJECTED')) {
        groupPaymentStatus = 'REJECTED';
      } else if (uniquePaymentStatuses.includes('PENDING')) {
        groupPaymentStatus = 'PENDING';
      }
      
      return {
        id: key,
        event: registrations[0].event,
        registrations,
        total,
        createdAt: registrations[0].createdAt, // Usar a primeira data
        status: groupStatus,
        paymentStatus: groupPaymentStatus,
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Ordenar grupos por data (mais recente primeiro)
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleUpdateShirtSize = async (registrationId: string, newShirtSize: string | null) => {
    try {
      setUpdatingShirtSize(true);
      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          shirtSize: newShirtSize || null,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Erro ao atualizar tamanho da camisa');
      }

      // Atualizar lista de inscrições
      await fetchRegistrations();
      setEditingShirtSize(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setUpdatingShirtSize(false);
    }
  };

  const handleCancelRegistration = async (registrationId: string, eventName: string) => {
    if (!confirm(`Tem certeza que deseja cancelar sua inscrição no evento "${eventName}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setCancellingRegistrationId(registrationId);
      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Erro ao cancelar inscrição');
      }

      // Atualizar lista de inscrições
      await fetchRegistrations();
      alert('Inscrição cancelada com sucesso!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setCancellingRegistrationId(null);
    }
  };

  const handlePayment = async (group: RegistrationGroup) => {
    try {
      setProcessingPaymentId(group.id);
      
      const registrationIds = group.registrations.map((r) => r.id);

      // Criar preferência no Mercado Pago
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          registrationIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar pagamento');
      }

      const data = await response.json();

      if (data.checkoutUrl) {
        // Redirecionar para o checkout do Mercado Pago
        window.location.href = data.checkoutUrl;
      } else {
        // Fallback: redirecionar para página de pendente
        window.location.href = `/inscricao/pendente?ids=${registrationIds.join(',')}`;
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert(error instanceof Error ? error.message : 'Erro ao processar pagamento');
      setProcessingPaymentId(null);
    }
  };

  if (!isHydrated || !participant) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      CONFIRMED: { label: 'Confirmada', variant: 'default' },
      PENDING: { label: 'Aguardando Pagamento', variant: 'secondary' },
      CANCELLED: { label: 'Cancelada', variant: 'destructive' },
    };

    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-neutral-off-white">
      {/* Header */}
      <header className="bg-white border-b border-neutral-light-gray">
        <div className="max-w-[1200px] mx-auto px-4 tablet:px-8 desktop:px-10">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="cursor-pointer">
              <h1 className="text-2xl font-bold text-primary">
                🏃 Okê Sports
              </h1>
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-gray hidden sm:block">
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
      <main className="max-w-[1200px] mx-auto px-4 tablet:px-8 desktop:px-10 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-neutral-gray hover:text-neutral-charcoal mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para home
          </Link>
          <h2 className="text-2xl font-bold text-neutral-charcoal mb-2">
            Minha Conta
          </h2>
          <p className="text-lg text-neutral-gray">
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
                <p className="text-sm font-medium text-neutral-gray">Nome</p>
                <p className="text-base text-neutral-charcoal">{participant.fullName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-gray">Email</p>
                <p className="text-base text-neutral-charcoal">{participant.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-gray">CPF</p>
                <p className="text-base text-neutral-charcoal">
                  {participant.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-gray">Telefone</p>
                <p className="text-base text-neutral-charcoal">{participant.phone}</p>
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
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-neutral-gray mb-4" />
                    <p className="text-sm text-neutral-gray mb-4">
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
                    {groupRegistrations(registrations).map((group) => (
                      <div
                        key={group.id}
                        className="p-4 border border-neutral-light-gray rounded-md hover:border-primary transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-neutral-charcoal">
                              {group.event.name}
                            </h3>
                            {group.registrations.length > 1 && (
                              <p className="text-sm text-neutral-gray">
                                {group.registrations.length} inscrições
                              </p>
                            )}
                          </div>
                          {getStatusBadge(group.status)}
                        </div>

                        {group.registrations.length > 1 ? (
                          // Múltiplas inscrições agrupadas
                          <div className="space-y-4 mt-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-neutral-gray">Data do Evento</p>
                                <p className="font-medium">
                                  {new Date(group.event.eventDate).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <div>
                                <p className="text-neutral-gray">Inscrito em</p>
                                <p className="font-medium">
                                  {new Date(group.createdAt).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-neutral-gray">Total</p>
                                <p className="font-bold text-lg">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(group.total)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="border-t border-neutral-light-gray pt-3">
                              <p className="text-sm font-medium text-neutral-charcoal mb-2">
                                Participantes:
                              </p>
                              <div className="space-y-2">
                                {group.registrations.map((reg) => (
                                  <div
                                    key={reg.id}
                                    className="p-3 bg-neutral-off-white rounded border border-neutral-light-gray"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <p className="font-medium text-neutral-charcoal">
                                          {reg.participant?.fullName || 'Participante'}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-neutral-gray">
                                          <div>
                                            <span>Número: </span>
                                            <span className="font-medium">#{reg.registrationNumber}</span>
                                          </div>
                                          <div>
                                            <span>Modalidade: </span>
                                            <span className="font-medium">{reg.modality.name}</span>
                                          </div>
                                          {reg.shirtSize && (
                                            <div>
                                              <span>Camisa: </span>
                                              <span className="font-medium">{reg.shirtSize}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Inscrição individual
                          (() => {
                            const registration = group.registrations[0];
                            return (
                              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                <div>
                                  <p className="text-neutral-gray">Número</p>
                                  <p className="font-medium">#{registration.registrationNumber}</p>
                                </div>
                                <div>
                                  <p className="text-neutral-gray">Data do Evento</p>
                                  <p className="font-medium">
                                    {new Date(registration.event.eventDate).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-neutral-gray">Modalidade</p>
                                  <p className="font-medium">{registration.modality.name}</p>
                                </div>
                                <div>
                                  <p className="text-neutral-gray">Valor</p>
                                  <p className="font-medium">
                                    {new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    }).format(registration.total)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-neutral-gray">Inscrito em</p>
                                  <p className="font-medium">
                                    {new Date(registration.createdAt).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-neutral-gray mb-1">Tamanho da Camisa</p>
                                  <p className="font-medium">
                                    {registration.shirtSize || (
                                      <span className="text-neutral-gray italic">Não informado</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            );
                          })()
                        )}

                        <div className="mt-4 flex gap-2 flex-wrap">
                          {group.status === 'PENDING' ? (
                            <>
                              <Button
                                size="sm"
                                className="flex-1 min-w-[120px] w-full"
                                onClick={() => handlePayment(group)}
                                disabled={processingPaymentId === group.id}
                              >
                                {processingPaymentId === group.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processando...
                                  </>
                                ) : (
                                  'Realizar Pagamento'
                                )}
                              </Button>
                              <Link href={`/e/${group.event.slug}/inscricao/${group.registrations[0].modality.id}?registrationId=${group.registrations[0].id}`} className="flex-1 min-w-[120px]">
                                <Button variant="outline" size="sm" className="w-full">
                                  Ver Inscrição
                                </Button>
                              </Link>
                              <Link href={`/e/${group.event.slug}`} className="flex-1 min-w-[120px]">
                                <Button variant="outline" size="sm" className="w-full">
                                  Ver Evento
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelRegistration(group.registrations[0].id, group.event.name)}
                                disabled={cancellingRegistrationId === group.registrations[0].id}
                                className="text-accent-danger hover:text-accent-danger hover:bg-accent-danger/10 border-accent-danger/20"
                              >
                                {cancellingRegistrationId === group.registrations[0].id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Cancelar'
                                )}
                              </Button>
                            </>
                          ) : group.status === 'CONFIRMED' ? (
                            <>
                              <Link href={`/e/${group.event.slug}/inscricao/${group.registrations[0].modality.id}?registrationId=${group.registrations[0].id}`} className="flex-1 min-w-[120px]">
                                <Button variant="outline" size="sm" className="w-full">
                                  Ver Inscrição
                                </Button>
                              </Link>
                              <Link href={`/e/${group.event.slug}`} className="flex-1 min-w-[120px]">
                                <Button variant="outline" size="sm" className="w-full">
                                  Ver Evento
                                </Button>
                              </Link>
                              <Button variant="outline" size="sm" disabled>
                                Baixar Comprovante
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelRegistration(group.registrations[0].id, group.event.name)}
                                disabled={cancellingRegistrationId === group.registrations[0].id}
                                className="text-accent-danger hover:text-accent-danger hover:bg-accent-danger/10 border-accent-danger/20"
                              >
                                {cancellingRegistrationId === group.registrations[0].id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Cancelar'
                                )}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Link href={`/e/${group.event.slug}/inscricao/${group.registrations[0].modality.id}?registrationId=${group.registrations[0].id}`} className="flex-1 min-w-[120px]">
                                <Button variant="outline" size="sm" className="w-full">
                                  Ver Inscrição
                                </Button>
                              </Link>
                              <Link href={`/e/${group.event.slug}`} className="flex-1 min-w-[120px]">
                                <Button variant="outline" size="sm" className="w-full">
                                  Ver Evento
                                </Button>
                              </Link>
                            </>
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
