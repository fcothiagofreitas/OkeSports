'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParticipantAuthStore } from '@/stores/participantAuthStore';
import { ArrowLeft, Loader2, CheckCircle2, Clock, XCircle, Plus, Users } from 'lucide-react';
import { useCart, type CartParticipant } from '@/hooks/useCart';
import { CartItem } from '@/components/events/CartItem';
import { AddParticipantModal } from '@/components/events/AddParticipantModal';

const registrationSchema = z.object({
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'Você deve aceitar os termos de uso',
  }),
  dataPrivacyAccepted: z.boolean().refine((val) => val === true, {
    message: 'Você deve aceitar a política de privacidade',
  }),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface EventData {
  id: string;
  name: string;
  slug: string;
  eventDate: string;
  modality: {
    id: string;
    name: string;
    description: string;
    price: number;
  };
  kit?: {
    includeShirt: boolean;
    shirtRequired: boolean;
    items?: Array<{ name: string; included: boolean }> | null;
    availableSizes?: Array<{ size: string; available: number }>;
  } | null;
}

export default function InscricaoPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const modalityId = params.modalityId as string;
  const registrationId = searchParams.get('registrationId');

  const { participant, accessToken, isAuthenticated } = useParticipantAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [existingRegistration, setExistingRegistration] = useState<any>(null);
  const [groupRegistrations, setGroupRegistrations] = useState<any[]>([]);
  const [groupTotal, setGroupTotal] = useState<number>(0);
  const [groupSubtotal, setGroupSubtotal] = useState<number>(0);
  const [groupPlatformFee, setGroupPlatformFee] = useState<number>(0);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [pricing, setPricing] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<CartParticipant | null>(null);
  const [participantShirtSize, setParticipantShirtSize] = useState<string | null>(null);

  // Buscar shirtSize do participante logado
  const fetchParticipantData = useCallback(async () => {
    if (!participant || !accessToken) return;
    
    try {
      const response = await fetch('/api/participants/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setParticipantShirtSize(data.shirtSize || null);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do participante:', error);
    }
  }, [participant, accessToken]);

  useEffect(() => {
    if (participant && accessToken) {
      fetchParticipantData();
    }
  }, [participant, accessToken, fetchParticipantData]);

  // Inicializar lista de participantes com participante logado
  const initialParticipant: CartParticipant | undefined = participant
    ? {
        id: 'self',
        fullName: participant.fullName,
        cpf: participant.cpf,
        email: participant.email,
        phone: participant.phone || '',
        birthDate: participant.birthDate || new Date().toISOString().split('T')[0],
        gender: participant.gender,
      }
    : undefined;

  const { cart, addParticipant, updateParticipant, removeParticipant, setCouponCode: setCartCouponCode, itemCount } = useCart(initialParticipant);

  // Atualizar shirtSize do participante logado quando for carregado
  useEffect(() => {
    if (participantShirtSize && participant && cart.items.length > 0) {
      const selfParticipant = cart.items.find((item) => item.id === 'self');
      if (selfParticipant && !selfParticipant.shirtSize) {
        updateParticipant('self', { shirtSize: participantShirtSize as any });
      }
    }
  }, [participantShirtSize, participant, cart.items, updateParticipant]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: process.env.NODE_ENV === 'development' ? {
      emergencyContact: 'Maria Silva',
      emergencyPhone: '85981907619',
      medicalInfo: 'Nenhuma restrição',
      teamName: 'Equipe Teste',
      termsAccepted: true,
      dataPrivacyAccepted: true,
    } : undefined,
  });

  // Verificar autenticação
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/e/${slug}/inscricao/${modalityId}`);
    }
  }, [isAuthenticated, router, slug, modalityId]);

  // Buscar dados do evento e modalidade
  useEffect(() => {
    async function fetchEventData() {
      try {
        const response = await fetch(`/api/events/by-slug/${slug}`);
        if (!response.ok) throw new Error('Evento não encontrado');

        const data = await response.json();
        const modality = data.modalities.find((m: any) => m.id === modalityId);

        if (!modality) {
          throw new Error('Modalidade não encontrada');
        }

        setEventData({
          id: data.id,
          name: data.name,
          slug: data.slug,
          eventDate: data.eventDate,
          allowGroupReg: data.allowGroupReg ?? true,
          maxGroupSize: data.maxGroupSize ?? 10,
          modality: {
            id: modality.id,
            name: modality.name,
            description: modality.description,
            price: modality.price,
          },
          kit: data.kit,
        });

        // Calcular preço inicial (sem cupom)
        await validateCoupon('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoadingEvent(false);
      }
    }

    fetchEventData();
  }, [slug, modalityId]);

  // Validar cupom e atualizar preço
  const validateCoupon = async (code: string) => {
    if (!eventData) return;

    setValidatingCoupon(true);
    try {
      const response = await fetch(`/api/events/${eventData.id}/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode: code || undefined,
          modalityId: eventData.modality.id,
        }),
      });

      const data = await response.json();
      if (data.pricing) {
        setPricing(data.pricing);
      }
    } catch (err) {
      console.error('Erro ao validar cupom:', err);
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Verificar se já existe inscrição ou buscar grupo de inscrições
  useEffect(() => {
    async function checkExistingRegistration() {
      if (!isAuthenticated || !accessToken || !eventData) return;

      // Se há registrationId na URL, buscar todas as inscrições do grupo
      if (registrationId) {
        try {
          const response = await fetch(
            `/api/registrations/group?registrationId=${registrationId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            setGroupRegistrations(data.registrations);
            setGroupTotal(data.total);
            setGroupSubtotal(data.subtotal);
            setGroupPlatformFee(data.platformFee);
            // Usar a primeira inscrição como referência para status
            if (data.registrations.length > 0) {
              setExistingRegistration({
                ...data.registrations[0],
                paymentStatus: data.paymentStatus,
                status: data.status,
              });
            }
          }
        } catch (err) {
          console.error('Error fetching registration group:', err);
        } finally {
          setCheckingRegistration(false);
        }
        return;
      }

      // Caso contrário, verificar inscrição individual (comportamento original)
      try {
        const response = await fetch(
          `/api/registrations/check?eventId=${eventData.id}&modalityId=${modalityId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.exists) {
            // Só definir existingRegistration se for inscrição ativa (PENDING ou CONFIRMED)
            // Se for cancelada (hasCancelledRegistration = true mas exists = false), permitir nova inscrição
            setExistingRegistration(data.registration);
          }
          // Se exists = false mas hasCancelledRegistration = true, usuário pode se inscrever novamente
          // Não precisa fazer nada, o formulário será exibido normalmente
        }
      } catch (err) {
        console.error('Error checking registration:', err);
      } finally {
        setCheckingRegistration(false);
      }
    }

    checkExistingRegistration();
  }, [isAuthenticated, accessToken, eventData, modalityId, registrationId]);

  const handlePayment = async () => {
    if (!existingRegistration) return;

    try {
      setIsLoading(true);
      setError(null);

      // Se há grupo de inscrições, usar todas; senão, usar apenas a inscrição individual
      const registrationIds = groupRegistrations.length > 0
        ? groupRegistrations.map((reg) => reg.id)
        : [existingRegistration.id];

      const checkoutResponse = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          registrationIds,
        }),
      });

      if (!checkoutResponse.ok) {
        const result = await checkoutResponse.json();
        throw new Error(result.error || 'Erro ao criar checkout');
      }

      const checkoutData = await checkoutResponse.json();
      window.location.href = checkoutData.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setIsLoading(false);
    }
  };

  // Sincronizar cupom
  useEffect(() => {
    if (couponCode) {
      setCartCouponCode(couponCode);
    }
  }, [couponCode, setCartCouponCode]);

  // Recalcular preço quando lista de participantes mudar
  useEffect(() => {
    if (eventData && cart.items.length > 0) {
      validateCoupon(couponCode);
    }
  }, [cart.items.length, eventData]);

  const handleAddParticipant = (participant: CartParticipant) => {
    if (editingParticipant) {
      updateParticipant(editingParticipant.id, participant);
      setEditingParticipant(null);
    } else {
      addParticipant(participant);
    }
    setShowAddModal(false);
  };

  const handleEditParticipant = (participant: CartParticipant) => {
    setEditingParticipant(participant);
    setShowAddModal(true);
  };

  const handleRemoveParticipant = (id: string) => {
    if (id === 'self') {
      alert('Não é possível remover sua própria inscrição');
      return;
    }
    if (confirm('Tem certeza que deseja remover este participante?')) {
      removeParticipant(id);
    }
  };

  const onSubmit = async (data: RegistrationFormData) => {
    if (!eventData || cart.items.length === 0) return;

    // Validar limites
    if (!eventData.allowGroupReg && cart.items.length > 1) {
      setError('Este evento não permite inscrição de terceiros');
      return;
    }

    if (eventData.maxGroupSize && cart.items.length > eventData.maxGroupSize) {
      setError(`Este evento permite no máximo ${eventData.maxGroupSize} participantes por compra`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Validar dados antes de enviar
      console.log('[INSCRIÇÃO] Enviando checkout com', cart.items.length, 'participante(s)');
      console.log('[INSCRIÇÃO] Participantes:', cart.items.map((p) => ({ name: p.fullName, cpf: p.cpf, email: p.email, birthDate: p.birthDate })));

      // Email pode repetir (múltiplas pessoas podem ter mesmo email)
      // Não precisa validar emails únicos

      // Validar CPFs únicos
      const cpfs = cart.items.map((p) => p.cpf.replace(/\D/g, ''));
      const cpfsUnicos = new Set(cpfs);
      if (cpfs.length !== cpfsUnicos.size) {
        throw new Error('Cada participante deve ter um CPF único. Verifique se não há CPFs duplicados na lista.');
      }

      // Validar dados obrigatórios de todos os participantes ANTES de processar
      const validationErrors: string[] = [];
      cart.items.forEach((item, index) => {
        if (!item.fullName || !item.cpf || !item.email || !item.phone || !item.birthDate) {
          validationErrors.push(`Participante ${index + 1} (${item.fullName || 'sem nome'}) está com dados incompletos. Verifique nome, CPF, email, telefone e data de nascimento.`);
        }
        if (!item.shirtSize) {
          validationErrors.push(`Participante ${index + 1} (${item.fullName || 'sem nome'}) precisa selecionar o tamanho da camisa.`);
        }
      });

      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(' '));
      }

      // Preparar dados dos participantes
      const participantsData = cart.items.map((item, index) => {

        // Converter birthDate para formato ISO datetime se necessário
        let birthDate = item.birthDate;
        if (typeof birthDate === 'string') {
          if (!birthDate.includes('T')) {
            // Se for apenas data (YYYY-MM-DD), converter para datetime
            birthDate = new Date(birthDate + 'T00:00:00').toISOString();
          }
        } else if (birthDate instanceof Date) {
          birthDate = birthDate.toISOString();
        }
        
        return {
          fullName: item.fullName.trim(),
          cpf: item.cpf.replace(/\D/g, ''), // Garantir que está sem formatação
          email: item.email.toLowerCase().trim(),
          phone: item.phone.replace(/\D/g, ''), // Garantir que está sem formatação
          birthDate: birthDate,
          gender: item.gender || 'NOT_INFORMED',
          // Informações adicionais do participante
          shirtSize: item.shirtSize,
          emergencyContact: item.emergencyContact,
          emergencyPhone: item.emergencyPhone,
          medicalInfo: item.medicalInfo,
          teamName: item.teamName,
        };
      });

      console.log('[INSCRIÇÃO] Dados validados, enviando para API...');

      // Usar endpoint /api/checkout que suporta múltiplos participantes
      const checkoutResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: eventData.id,
          modalityId: eventData.modality.id,
          participants: participantsData,
          couponCode: couponCode || undefined,
          paymentMethod: 'pix', // Por enquanto só PIX
        }),
      });

      const responseData = await checkoutResponse.json();

      if (!checkoutResponse.ok) {
        let errorMsg = responseData.error || 'Erro ao criar checkout';
        
        if (responseData.details) {
          if (Array.isArray(responseData.details)) {
            const detailsMsg = responseData.details
              .map((issue: any) => {
                const path = issue.path?.join('.') || 'campo';
                return `${path}: ${issue.message}`;
              })
              .join(', ');
            errorMsg = `${errorMsg}: ${detailsMsg}`;
          } else if (typeof responseData.details === 'string') {
            errorMsg = `${errorMsg}: ${responseData.details}`;
          }
        }

        console.error('[INSCRIÇÃO] Erro no checkout:', errorMsg, responseData);
        throw new Error(errorMsg);
      }

      console.log('[INSCRIÇÃO] Checkout criado com sucesso:', {
        registrationIds: responseData.registrationIds,
        registrationNumbers: responseData.registrationNumbers,
        participantsCount: responseData.registrationIds?.length || 0,
      });

      // Validar resposta
      if (!responseData.registrationIds || responseData.registrationIds.length === 0) {
        throw new Error('Nenhuma inscrição foi criada. Por favor, tente novamente.');
      }

      if (responseData.registrationIds.length !== cart.items.length) {
        console.warn('[INSCRIÇÃO] ⚠️ Aviso: Número de inscrições criadas difere do número de participantes', {
          esperado: cart.items.length,
          criado: responseData.registrationIds.length,
        });
        // Não lançar erro, mas avisar
        setError(`Aviso: Apenas ${responseData.registrationIds.length} de ${cart.items.length} inscrição(ões) foram criadas. Verifique sua conta.`);
      }

      // Se tiver checkoutUrl do Mercado Pago, redirecionar para lá
      // Caso contrário, redirecionar para página de pagamento pendente (fallback mock)
      if (responseData.checkoutUrl) {
        window.location.href = responseData.checkoutUrl;
      } else {
        // Fallback: Redirecionar para página de pagamento pendente
        const registrationIds = responseData.registrationIds || [responseData.registrationId];
        if (registrationIds.length > 0) {
          router.push(`/inscricao/pendente?ids=${registrationIds.join(',')}`);
        } else {
          throw new Error('Nenhuma inscrição foi criada. Por favor, tente novamente.');
        }
      }
    } catch (err) {
      console.error('[INSCRIÇÃO] Erro ao processar checkout:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao processar inscrição');
      setIsLoading(false);
      // NÃO redirecionar para home em caso de erro - manter na página para o usuário ver o erro
    }
  };

  if (loadingEvent || checkingRegistration) {
    return (
      <div className="min-h-screen bg-neutral-off-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-neutral-off-white flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">{error || 'Evento não encontrado'}</p>
            <Link href="/" className="block mt-4">
              <Button variant="outline" className="w-full">
                Voltar para Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Se já existe inscrição, mostrar status
  if (existingRegistration) {
    const getStatusInfo = () => {
      if (existingRegistration.paymentStatus === 'APPROVED') {
        return {
          icon: <CheckCircle2 className="h-12 w-12 text-green-600" />,
          title: 'Inscrição Confirmada!',
          description: 'Seu pagamento foi aprovado e sua inscrição está confirmada.',
          color: 'green',
        };
      }
      if (existingRegistration.paymentStatus === 'PENDING') {
        return {
          icon: <Clock className="h-12 w-12 text-yellow-600" />,
          title: 'Pagamento Pendente',
          description: 'Aguardando confirmação do pagamento.',
          color: 'yellow',
        };
      }
      return {
        icon: <XCircle className="h-12 w-12 text-red-600" />,
        title: 'Pagamento Não Realizado',
        description: 'O pagamento não foi concluído. Clique no botão abaixo para tentar novamente.',
        color: 'red',
      };
    };

    const statusInfo = getStatusInfo();

    return (
      <div className="min-h-screen bg-neutral-off-white py-12">
        <div className="max-w-3xl mx-auto px-6">
          <Link
            href="/minha-conta"
            className="inline-flex items-center text-sm text-neutral-gray hover:text-neutral-charcoal mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Minha Conta
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Status da Inscrição</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">{statusInfo.icon}</div>
                <h3 className="text-xl font-bold text-neutral-charcoal mb-2">{statusInfo.title}</h3>
                <p className="text-neutral-gray mb-6">{statusInfo.description}</p>

                <div className="bg-neutral-off-white rounded-md p-6 mb-6 text-left border border-neutral-light-gray">
                  <h4 className="font-bold text-neutral-charcoal mb-4">Detalhes da Inscrição</h4>
                  <div className="space-y-2 text-sm mb-4">
                    <p>
                      <span className="text-neutral-gray">Evento:</span> {existingRegistration.event?.name || eventData?.name}
                    </p>
                    <p>
                      <span className="text-neutral-gray">Data da inscrição:</span>{' '}
                      {new Date(existingRegistration.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  {/* Mostrar todas as inscrições do grupo se houver */}
                  {groupRegistrations.length > 0 ? (
                    <>
                      <div className="mt-4 pt-4 border-t border-neutral-light-gray">
                        <h5 className="font-bold text-neutral-charcoal mb-3">Participantes</h5>
                        <div className="space-y-3">
                          {groupRegistrations.map((reg) => (
                            <div
                              key={reg.id}
                              className="p-3 bg-white rounded border border-neutral-light-gray"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-neutral-charcoal">
                                    {reg.participant.fullName}
                                    {reg.participant.id === participant?.id && (
                                      <span className="text-neutral-gray text-sm ml-2">(Você)</span>
                                    )}
                                  </p>
                                  <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-neutral-gray">
                                    <div>
                                      <span>CPF: </span>
                                      <span className="font-medium">{reg.participant.cpf}</span>
                                    </div>
                                    <div>
                                      <span>Email: </span>
                                      <span className="font-medium">{reg.participant.email}</span>
                                    </div>
                                    <div>
                                      <span>Telefone: </span>
                                      <span className="font-medium">{reg.participant.phone}</span>
                                    </div>
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
                                        <span>Camiseta: </span>
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

                      <div className="mt-4 pt-4 border-t border-neutral-light-gray">
                        <h5 className="font-bold text-neutral-charcoal mb-3">Resumo Financeiro</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-neutral-gray">
                              Inscrição x {groupRegistrations.length}
                            </span>
                            <span className="font-medium">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(groupSubtotal)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-gray">Taxa de serviço:</span>
                            <span className="font-medium">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(groupPlatformFee)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-neutral-light-gray">
                            <span className="font-bold text-neutral-charcoal">Total:</span>
                            <span className="font-bold text-primary">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(groupTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Fallback para inscrição individual (comportamento original)
                    <>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-neutral-gray">Número:</span>{' '}
                          <span className="font-mono font-medium">#{existingRegistration.registrationNumber}</span>
                        </p>
                        <p>
                          <span className="text-neutral-gray">Modalidade:</span>{' '}
                          {existingRegistration.modality?.name}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-neutral-light-gray">
                        <h5 className="font-bold text-neutral-charcoal mb-3">Valores</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-neutral-gray">
                              Inscrição x 1
                            </span>
                            <span className="font-medium">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(existingRegistration.subtotal)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-gray">Taxa de serviço:</span>
                            <span className="font-medium">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(existingRegistration.platformFee)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-neutral-light-gray">
                            <span className="font-bold text-neutral-charcoal">Total:</span>
                            <span className="font-bold text-primary">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(existingRegistration.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {existingRegistration.paymentStatus !== 'APPROVED' && (
                  <>
                    {error && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200 mb-4">
                        {error}
                      </div>
                    )}
                    <Button onClick={handlePayment} disabled={isLoading} size="lg" className="w-full">
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        'Realizar Pagamento'
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Formulário de nova inscrição
  return (
    <div className="min-h-screen bg-neutral-off-white py-12">
      <div className="max-w-3xl mx-auto px-6">
        <Link
          href={`/e/${slug}`}
          className="inline-flex items-center text-sm text-neutral-gray hover:text-neutral-charcoal mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para o evento
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="h-6 w-6" />
              Inscrições
            </CardTitle>
            <CardDescription>
              {itemCount === 1
                ? '1 participante'
                : `${itemCount} participantes`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Resumo do Evento */}
            <div className="mb-6 p-4 bg-neutral-off-white rounded-md border border-neutral-light-gray">
              <h3 className="font-bold text-neutral-charcoal mb-2">{eventData.name}</h3>
              <p className="text-sm text-neutral-gray mb-1">
                Modalidade: <span className="font-medium">{eventData.modality.name}</span>
              </p>
              <p className="text-sm text-neutral-gray">
                Data: {new Date(eventData.eventDate).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            {/* Lista de Participantes */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-neutral-charcoal">Participantes</h4>
                {eventData.allowGroupReg && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingParticipant(null);
                      setShowAddModal(true);
                    }}
                    disabled={eventData.maxGroupSize ? itemCount >= eventData.maxGroupSize : false}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Pessoa
                  </Button>
                )}
              </div>

              {!eventData.allowGroupReg && itemCount > 1 && (
                <div className="rounded-md bg-accent-warning/10 p-3 text-sm text-accent-warning border border-accent-warning/20">
                  Este evento não permite inscrição de terceiros. Apenas sua inscrição será processada.
                </div>
              )}

              {eventData.maxGroupSize && itemCount >= eventData.maxGroupSize && (
                <div className="rounded-md bg-accent-info/10 p-3 text-sm text-accent-info border border-accent-info/20">
                  Limite de {eventData.maxGroupSize} participantes por compra atingido.
                </div>
              )}

              <div className="space-y-3">
                {cart.items.map((item) => (
                  <CartItem
                    key={item.id}
                    participant={item}
                    onEdit={() => handleEditParticipant(item)}
                    onRemove={() => handleRemoveParticipant(item.id)}
                    showRemove={item.id !== 'self' || cart.items.length > 1}
                  />
                ))}
              </div>

              {cart.items.length === 0 && (
                <div className="text-center py-8 text-neutral-gray">
                  <p>Nenhum participante adicionado</p>
                </div>
              )}
            </div>

            {/* Resumo Financeiro */}
            {pricing && (
              <div className="mb-6 p-4 bg-neutral-off-white rounded-md border border-neutral-light-gray">
                <h4 className="font-bold text-neutral-charcoal mb-4">Resumo Financeiro</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-gray">
                      Inscrição x {itemCount}
                    </span>
                    <span>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(pricing.subtotal * itemCount)}
                    </span>
                  </div>
                  {pricing.batchDiscount > 0 && (
                    <div className="flex justify-between text-accent-success">
                      <span>Desconto ({pricing.batchName}):</span>
                      <span>
                        - {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(pricing.batchDiscount * itemCount)}
                      </span>
                    </div>
                  )}
                  {pricing.couponDiscount > 0 && (
                    <div className="flex justify-between text-accent-success">
                      <span>Cupom ({pricing.couponCode}):</span>
                      <span>
                        - {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(pricing.couponDiscount * itemCount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-neutral-light-gray">
                    <span className="text-neutral-gray">Subtotal:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format((pricing.subtotal - (pricing.batchDiscount + pricing.couponDiscount)) * itemCount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-gray">Taxa de serviço:</span>
                    <span>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(pricing.platformFee * itemCount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-primary pt-2 border-t border-neutral-light-gray">
                    <span>Total:</span>
                    <span>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(pricing.total * itemCount)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-accent-danger/10 p-3 text-sm text-accent-danger border border-accent-danger/20 mb-6">
                {error}
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Cupom de Desconto */}
              <div className="space-y-2">
                <Label htmlFor="couponCode">Cupom de Desconto (Opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="couponCode"
                    placeholder="Digite o código do cupom"
                    value={couponCode}
                    onChange={(e) => {
                      const code = e.target.value.toUpperCase();
                      setCouponCode(code);
                      if (code.length >= 3) {
                        validateCoupon(code);
                      } else if (code.length === 0) {
                        validateCoupon('');
                      }
                    }}
                    disabled={isLoading || validatingCoupon}
                    className="uppercase"
                  />
                  {validatingCoupon && (
                    <Loader2 className="h-4 w-4 animate-spin text-neutral-gray self-center" />
                  )}
                </div>
                {pricing?.couponCode && (
                  <p className="text-sm text-accent-success">
                    ✓ Cupom {pricing.couponCode} aplicado! Desconto de{' '}
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(pricing.couponDiscount)}
                  </p>
                )}
                {couponCode && !pricing?.couponCode && !validatingCoupon && (
                  <p className="text-sm text-accent-danger">
                    Cupom inválido ou não aplicável para esta modalidade
                  </p>
                )}
              </div>

              {/* Nota sobre informações adicionais */}
              {itemCount > 1 && (
                <div className="rounded-md bg-accent-info/10 p-3 text-sm text-accent-info border border-accent-info/20">
                  <p className="font-medium mb-1">Informações Adicionais</p>
                  <p>
                    Você pode editar cada participante para adicionar informações como tamanho de camiseta,
                    contato de emergência, etc.
                  </p>
                </div>
              )}

              {/* Aceites Obrigatórios */}
              <div className="space-y-3 pt-4 border-t border-neutral-light-gray">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="termsAccepted"
                    {...register('termsAccepted')}
                    disabled={isLoading}
                    className="mt-1"
                  />
                  <label htmlFor="termsAccepted" className="text-sm text-neutral-dark-gray">
                    Aceito os{' '}
                    <a href="/termos" target="_blank" className="text-primary hover:underline">
                      termos de uso
                    </a>{' '}
                    e{' '}
                    <a href="#" className="text-primary hover:underline">
                      regulamento do evento
                    </a>{' '}
                    *
                  </label>
                </div>
                {errors.termsAccepted && (
                  <p className="text-sm text-accent-danger">{errors.termsAccepted.message}</p>
                )}

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="dataPrivacyAccepted"
                    {...register('dataPrivacyAccepted')}
                    disabled={isLoading}
                    className="mt-1"
                  />
                  <label htmlFor="dataPrivacyAccepted" className="text-sm text-neutral-dark-gray">
                    Aceito a{' '}
                    <a href="/privacidade" target="_blank" className="text-primary hover:underline">
                      política de privacidade
                    </a>{' '}
                    *
                  </label>
                </div>
                {errors.dataPrivacyAccepted && (
                  <p className="text-sm text-accent-danger">{errors.dataPrivacyAccepted.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || cart.items.length === 0} 
                className="w-full" 
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Realizar Pagamento'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Modal para adicionar/editar participante */}
      <AddParticipantModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSave={handleAddParticipant}
        participant={editingParticipant}
        kitIncludeShirt={eventData?.kit?.includeShirt || false}
        kitShirtRequired={eventData?.kit?.shirtRequired || false}
      />
    </div>
  );
}
