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
import { useParticipantAuthStore } from '@/stores/participantAuthStore';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Users,
  Calendar,
  Tag,
  ChevronRight,
  Ticket,
} from 'lucide-react';
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
  allowGroupReg?: boolean;
  maxGroupSize?: number;
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

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

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

  const fetchParticipantData = useCallback(async () => {
    if (!participant || !accessToken) return;
    try {
      const response = await fetch('/api/participants/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
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
    if (participant && accessToken) fetchParticipantData();
  }, [participant, accessToken, fetchParticipantData]);

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

  const { cart, addParticipant, updateParticipant, removeParticipant, setCouponCode: setCartCouponCode, itemCount } =
    useCart(initialParticipant);

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
    defaultValues:
      process.env.NODE_ENV === 'development'
        ? { termsAccepted: true, dataPrivacyAccepted: true }
        : undefined,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/e/${slug}/inscricao/${modalityId}`);
    }
  }, [isAuthenticated, router, slug, modalityId]);

  useEffect(() => {
    async function fetchEventData() {
      try {
        const response = await fetch(`/api/events/by-slug/${slug}`);
        if (!response.ok) throw new Error('Evento não encontrado');
        const data = await response.json();
        const modality = data.modalities.find((m: any) => m.id === modalityId);
        if (!modality) throw new Error('Modalidade não encontrada');
        setEventData({
          id: data.id,
          name: data.name,
          slug: data.slug,
          eventDate: data.eventDate,
          allowGroupReg: data.allowGroupReg ?? true,
          maxGroupSize: data.maxGroupSize ?? 10,
          modality: { id: modality.id, name: modality.name, description: modality.description, price: modality.price },
          kit: data.kit,
        });
        await validateCoupon('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoadingEvent(false);
      }
    }
    fetchEventData();
  }, [slug, modalityId]);

  const validateCoupon = async (code: string) => {
    if (!eventData) return;
    setValidatingCoupon(true);
    try {
      const response = await fetch(`/api/events/${eventData.id}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: code || undefined, modalityId: eventData.modality.id }),
      });
      const data = await response.json();
      if (data.pricing) setPricing(data.pricing);
    } catch (err) {
      console.error('Erro ao validar cupom:', err);
    } finally {
      setValidatingCoupon(false);
    }
  };

  useEffect(() => {
    async function checkExistingRegistration() {
      if (!isAuthenticated || !accessToken || !eventData) return;
      if (registrationId) {
        try {
          const response = await fetch(`/api/registrations/group?registrationId=${registrationId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (response.ok) {
            const data = await response.json();
            setGroupRegistrations(data.registrations);
            setGroupTotal(data.total);
            setGroupSubtotal(data.subtotal);
            setGroupPlatformFee(data.platformFee);
            if (data.registrations.length > 0) {
              setExistingRegistration({ ...data.registrations[0], paymentStatus: data.paymentStatus, status: data.status });
            }
          }
        } catch (err) {
          console.error('Error fetching registration group:', err);
        } finally {
          setCheckingRegistration(false);
        }
        return;
      }
      try {
        const response = await fetch(`/api/registrations/check?eventId=${eventData.id}&modalityId=${modalityId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.exists) setExistingRegistration(data.registration);
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
      const registrationIds =
        groupRegistrations.length > 0 ? groupRegistrations.map((reg) => reg.id) : [existingRegistration.id];
      const checkoutResponse = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ registrationIds }),
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

  useEffect(() => {
    if (couponCode) setCartCouponCode(couponCode);
  }, [couponCode, setCartCouponCode]);

  useEffect(() => {
    if (eventData && cart.items.length > 0) validateCoupon(couponCode);
  }, [cart.items.length, eventData]);

  const handleAddParticipant = (p: CartParticipant) => {
    if (editingParticipant) {
      updateParticipant(editingParticipant.id, p);
      setEditingParticipant(null);
    } else {
      addParticipant(p);
    }
    setShowAddModal(false);
  };

  const handleEditParticipant = (p: CartParticipant) => {
    setEditingParticipant(p);
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
      const cpfs = cart.items.map((p) => p.cpf.replace(/\D/g, ''));
      if (cpfs.length !== new Set(cpfs).size) {
        throw new Error('Cada participante deve ter um CPF único.');
      }
      const validationErrors: string[] = [];
      cart.items.forEach((item, index) => {
        if (!item.fullName || !item.cpf || !item.email || !item.phone || !item.birthDate)
          validationErrors.push(`Participante ${index + 1} (${item.fullName || 'sem nome'}) está com dados incompletos.`);
        if (!item.shirtSize) validationErrors.push(`Participante ${index + 1} precisa selecionar o tamanho da camisa.`);
      });
      if (validationErrors.length > 0) throw new Error(validationErrors.join(' '));

      const participantsData = cart.items.map((item) => {
        let birthDate = item.birthDate;
        if (typeof birthDate === 'string' && !birthDate.includes('T')) {
          birthDate = new Date(birthDate + 'T00:00:00').toISOString();
        } else if (birthDate instanceof Date) {
          birthDate = birthDate.toISOString();
        }
        return {
          fullName: item.fullName.trim(),
          cpf: item.cpf.replace(/\D/g, ''),
          email: item.email.toLowerCase().trim(),
          phone: item.phone.replace(/\D/g, ''),
          birthDate,
          gender: item.gender || 'NOT_INFORMED',
          shirtSize: item.shirtSize,
          emergencyContact: item.emergencyContact,
          emergencyPhone: item.emergencyPhone,
          medicalInfo: item.medicalInfo,
          teamName: item.teamName,
        };
      });

      const checkoutResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventData.id,
          modalityId: eventData.modality.id,
          participants: participantsData,
          couponCode: couponCode || undefined,
          paymentMethod: 'pix',
        }),
      });
      const responseData = await checkoutResponse.json();
      if (!checkoutResponse.ok) {
        let errorMsg = responseData.error || 'Erro ao criar checkout';
        if (responseData.details) {
          if (Array.isArray(responseData.details)) {
            errorMsg += ': ' + responseData.details.map((i: any) => `${i.path?.join('.') || 'campo'}: ${i.message}`).join(', ');
          } else if (typeof responseData.details === 'string') {
            errorMsg += ': ' + responseData.details;
          }
        }
        throw new Error(errorMsg);
      }
      if (!responseData.registrationIds || responseData.registrationIds.length === 0) {
        throw new Error('Nenhuma inscrição foi criada. Por favor, tente novamente.');
      }
      if (responseData.checkoutUrl) {
        window.location.href = responseData.checkoutUrl;
      } else {
        const ids = responseData.registrationIds || [responseData.registrationId];
        if (ids.length > 0) router.push(`/inscricao/pendente?ids=${ids.join(',')}`);
        else throw new Error('Nenhuma inscrição foi criada.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao processar inscrição');
      setIsLoading(false);
    }
  };

  // ---------- Loading ----------
  if (loadingEvent || checkingRegistration) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7]">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // ---------- Error ----------
  if (!eventData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] p-6">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <XCircle className="mx-auto h-10 w-10 text-red-400" />
          <p className="mt-3 text-sm text-slate-600">{error || 'Evento não encontrado'}</p>
          <Link href="/">
            <Button variant="outline" className="mt-4 w-full rounded-lg">
              Voltar para Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // ---------- Existing Registration Status ----------
  if (existingRegistration) {
    const statusMap: Record<string, { icon: React.ReactNode; title: string; desc: string; accent: string }> = {
      APPROVED: {
        icon: <CheckCircle2 className="h-10 w-10 text-emerald-500" />,
        title: 'Inscrição Confirmada',
        desc: 'Pagamento aprovado. Sua inscrição está confirmada.',
        accent: 'emerald',
      },
      PENDING: {
        icon: <Clock className="h-10 w-10 text-amber-500" />,
        title: 'Pagamento Pendente',
        desc: 'Aguardando confirmação do pagamento.',
        accent: 'amber',
      },
    };
    const status = statusMap[existingRegistration.paymentStatus] || {
      icon: <XCircle className="h-10 w-10 text-red-400" />,
      title: 'Pagamento Não Realizado',
      desc: 'O pagamento não foi concluído. Tente novamente.',
      accent: 'red',
    };

    return (
      <div className="min-h-screen bg-[#f5f5f7]">
        <header className="sticky top-0 z-50 border-b border-black/[0.04] bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-3xl items-center px-4 py-3 sm:px-6">
            <Link href="/minha-conta" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
              <ArrowLeft className="h-4 w-4" />
              Minha Conta
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          {/* Status Banner */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto mb-3">{status.icon}</div>
            <h2 className="text-xl font-bold text-slate-900">{status.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{status.desc}</p>
          </div>

          {/* Details */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Detalhes</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>
                <span className="text-slate-400">Evento:</span>{' '}
                <span className="font-medium text-slate-900">{existingRegistration.event?.name || eventData?.name}</span>
              </p>
              <p>
                <span className="text-slate-400">Data da inscrição:</span>{' '}
                {new Date(existingRegistration.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>

            {groupRegistrations.length > 0 ? (
              <>
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Participantes</p>
                  <div className="mt-3 space-y-2">
                    {groupRegistrations.map((reg) => (
                      <div key={reg.id} className="rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">
                            {reg.participant.fullName}
                            {reg.participant.id === participant?.id && (
                              <span className="ml-1.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                                Você
                              </span>
                            )}
                          </p>
                          <span className="ml-auto text-xs font-medium text-slate-400">#{reg.registrationNumber}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-500">
                          <span>{reg.participant.email}</span>
                          <span>{reg.modality.name}</span>
                          {reg.shirtSize && <span>Camiseta: {reg.shirtSize}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Resumo</p>
                  <div className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-500">
                      <span>Inscrição x {groupRegistrations.length}</span>
                      <span>{fmt.format(groupSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Taxa de serviço</span>
                      <span>{fmt.format(groupPlatformFee)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-slate-900">
                      <span>Total</span>
                      <span>{fmt.format(groupTotal)}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p>
                    <span className="text-slate-400">Número:</span>{' '}
                    <span className="font-mono font-medium">#{existingRegistration.registrationNumber}</span>
                  </p>
                  <p>
                    <span className="text-slate-400">Modalidade:</span> {existingRegistration.modality?.name}
                  </p>
                </div>
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-500">
                      <span>Inscrição x 1</span>
                      <span>{fmt.format(existingRegistration.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Taxa de serviço</span>
                      <span>{fmt.format(existingRegistration.platformFee)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-slate-900">
                      <span>Total</span>
                      <span>{fmt.format(existingRegistration.total)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {existingRegistration.paymentStatus !== 'APPROVED' && (
            <div className="mt-4">
              {error && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}
              <Button onClick={handlePayment} disabled={isLoading} size="lg" className="w-full rounded-xl">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Realizar Pagamento'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- New Registration Form ----------
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-black/[0.04] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href={`/e/${slug}`} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" />
            {eventData.name}
          </Link>
          <p className="text-xs font-semibold text-slate-400">
            {itemCount} {itemCount === 1 ? 'participante' : 'participantes'}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Left Column: Participants */}
          <div className="space-y-4">
            {/* Event Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900">
                  <Ticket className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">{eventData.name}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {eventData.modality.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(eventData.eventDate).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Participants List */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-900">Participantes</h2>
                </div>
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
                    className="gap-1.5 rounded-lg text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar
                  </Button>
                )}
              </div>

              {!eventData.allowGroupReg && itemCount > 1 && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                  Este evento não permite inscrição de terceiros.
                </div>
              )}

              {eventData.maxGroupSize && itemCount >= eventData.maxGroupSize && (
                <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                  Limite de {eventData.maxGroupSize} participantes atingido.
                </div>
              )}

              <div className="mt-4 space-y-2">
                {cart.items.map((item) => (
                  <CartItem
                    key={item.id}
                    participant={item}
                    onEdit={() => handleEditParticipant(item)}
                    onRemove={() => handleRemoveParticipant(item.id)}
                    showRemove={item.id !== 'self' || cart.items.length > 1}
                  />
                ))}
                {cart.items.length === 0 && (
                  <div className="py-8 text-center text-sm text-slate-400">Nenhum participante adicionado</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar (Summary + Payment) */}
          <div className="space-y-4 lg:sticky lg:top-16 lg:self-start">
            {/* Coupon */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Label htmlFor="couponCode" className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Cupom de desconto
              </Label>
              <div className="mt-2 flex gap-2">
                <Input
                  id="couponCode"
                  placeholder="Código"
                  value={couponCode}
                  onChange={(e) => {
                    const code = e.target.value.toUpperCase();
                    setCouponCode(code);
                    if (code.length >= 3) validateCoupon(code);
                    else if (code.length === 0) validateCoupon('');
                  }}
                  disabled={isLoading || validatingCoupon}
                  className="rounded-lg uppercase"
                />
                {validatingCoupon && <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin self-center text-slate-400" />}
              </div>
              {pricing?.couponCode && (
                <p className="mt-2 text-xs font-medium text-emerald-600">
                  Cupom {pricing.couponCode} aplicado — desconto de {fmt.format(pricing.couponDiscount)}
                </p>
              )}
              {couponCode && !pricing?.couponCode && !validatingCoupon && (
                <p className="mt-2 text-xs text-red-500">Cupom inválido ou não aplicável</p>
              )}
            </div>

            {/* Financial Summary */}
            {pricing && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Resumo</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Inscrição x {itemCount}</span>
                    <span>{fmt.format(pricing.subtotal * itemCount)}</span>
                  </div>
                  {pricing.batchDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Desconto ({pricing.batchName})</span>
                      <span>- {fmt.format(pricing.batchDiscount * itemCount)}</span>
                    </div>
                  )}
                  {pricing.couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Cupom ({pricing.couponCode})</span>
                      <span>- {fmt.format(pricing.couponDiscount * itemCount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-500">
                    <span>Subtotal</span>
                    <span>{fmt.format((pricing.subtotal - (pricing.batchDiscount + pricing.couponDiscount)) * itemCount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Taxa de serviço</span>
                    <span>{fmt.format(pricing.platformFee * itemCount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 text-lg font-bold text-slate-900">
                    <span>Total</span>
                    <span>{fmt.format(pricing.total * itemCount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Terms + Submit */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {error && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>
                )}

                <div className="space-y-3">
                  <label className="flex items-start gap-2.5 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      {...register('termsAccepted')}
                      disabled={isLoading}
                      className="mt-0.5 rounded"
                    />
                    <span>
                      Aceito os{' '}
                      <a href="/termos" target="_blank" className="font-medium text-slate-900 underline underline-offset-2">
                        termos de uso
                      </a>{' '}
                      e regulamento
                    </span>
                  </label>
                  {errors.termsAccepted && <p className="text-xs text-red-500">{errors.termsAccepted.message}</p>}

                  <label className="flex items-start gap-2.5 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      {...register('dataPrivacyAccepted')}
                      disabled={isLoading}
                      className="mt-0.5 rounded"
                    />
                    <span>
                      Aceito a{' '}
                      <a href="/privacidade" target="_blank" className="font-medium text-slate-900 underline underline-offset-2">
                        política de privacidade
                      </a>
                    </span>
                  </label>
                  {errors.dataPrivacyAccepted && (
                    <p className="text-xs text-red-500">{errors.dataPrivacyAccepted.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || cart.items.length === 0}
                  size="lg"
                  className="mt-5 w-full rounded-xl"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Realizar Pagamento
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

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
