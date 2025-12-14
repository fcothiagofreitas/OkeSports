'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { ArrowLeft, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';

const registrationSchema = z.object({
  couponCode: z.string().optional(),
  shirtSize: z.enum(['PP', 'P', 'M', 'G', 'GG', 'XG']).optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  medicalInfo: z.string().optional(),
  teamName: z.string().optional(),
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
  const slug = params.slug as string;
  const modalityId = params.modalityId as string;

  const { participant, accessToken, isAuthenticated } = useParticipantAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [existingRegistration, setExistingRegistration] = useState<any>(null);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [pricing, setPricing] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

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
          modality: {
            id: modality.id,
            name: modality.name,
            description: modality.description,
            price: modality.price,
          },
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

  // Verificar se já existe inscrição
  useEffect(() => {
    async function checkExistingRegistration() {
      if (!isAuthenticated || !accessToken || !eventData) return;

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
            setExistingRegistration(data.registration);
          }
        }
      } catch (err) {
        console.error('Error checking registration:', err);
      } finally {
        setCheckingRegistration(false);
      }
    }

    checkExistingRegistration();
  }, [isAuthenticated, accessToken, eventData, modalityId]);

  const handlePayment = async () => {
    if (!existingRegistration) return;

    try {
      setIsLoading(true);
      setError(null);

      const checkoutResponse = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId: existingRegistration.id,
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

  const onSubmit = async (data: RegistrationFormData) => {
    if (!eventData) return;

    try {
      setIsLoading(true);
      setError(null);

      // 1. Criar inscrição
      const registrationResponse = await fetch('/api/registrations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          eventId: eventData.id,
          modalityId: eventData.modality.id,
          couponCode: couponCode || undefined,
          ...data,
        }),
      });

      if (!registrationResponse.ok) {
        const result = await registrationResponse.json();
        const errorMsg = result.details
          ? `${result.error}: ${result.details}`
          : result.error || 'Erro ao criar inscrição';
        throw new Error(errorMsg);
      }

      const registrationData = await registrationResponse.json();
      const registrationId = registrationData.registration.id;

      // 2. Criar checkout no Mercado Pago
      const checkoutResponse = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId,
        }),
      });

      if (!checkoutResponse.ok) {
        const result = await checkoutResponse.json();
        throw new Error(result.error || 'Erro ao criar checkout');
      }

      const checkoutData = await checkoutResponse.json();

      // 3. Redirecionar para Mercado Pago
      window.location.href = checkoutData.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setIsLoading(false);
    }
  };

  if (loadingEvent || checkingRegistration) {
    return (
      <div className="min-h-screen bg-[hsl(var(--gray-100))] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--accent-pink))]" />
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-[hsl(var(--gray-100))] flex items-center justify-center p-6">
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
      <div className="min-h-screen bg-[hsl(var(--gray-100))] py-12">
        <div className="max-w-3xl mx-auto px-6">
          <Link
            href={`/e/${slug}`}
            className="inline-flex items-center text-sm text-[hsl(var(--gray-600))] hover:text-[hsl(var(--dark))] mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o evento
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Status da Inscrição</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">{statusInfo.icon}</div>
                <h3 className="text-xl font-bold text-[hsl(var(--dark))] mb-2">{statusInfo.title}</h3>
                <p className="text-[hsl(var(--gray-600))] mb-6">{statusInfo.description}</p>

                <div className="bg-[hsl(var(--gray-50))] rounded-lg p-6 mb-6 text-left">
                  <h4 className="font-semibold text-[hsl(var(--dark))] mb-4">Detalhes da Inscrição</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-[hsl(var(--gray-600))]">Número:</span>{' '}
                      <span className="font-mono font-medium">#{existingRegistration.registrationNumber}</span>
                    </p>
                    <p>
                      <span className="text-[hsl(var(--gray-600))]">Evento:</span> {existingRegistration.event.name}
                    </p>
                    <p>
                      <span className="text-[hsl(var(--gray-600))]">Modalidade:</span>{' '}
                      {existingRegistration.modality.name}
                    </p>
                    <p>
                      <span className="text-[hsl(var(--gray-600))]">Data da inscrição:</span>{' '}
                      {new Date(existingRegistration.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[hsl(var(--gray-200))]">
                    <h5 className="font-medium text-[hsl(var(--dark))] mb-3">Valores</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[hsl(var(--gray-600))]">
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
                        <span className="text-[hsl(var(--gray-600))]">Taxa de serviço:</span>
                        <span className="font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(existingRegistration.platformFee)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[hsl(var(--gray-200))]">
                        <span className="font-semibold text-[hsl(var(--dark))]">Total:</span>
                        <span className="font-bold text-[hsl(var(--accent-pink))]">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(existingRegistration.total)}
                        </span>
                      </div>
                    </div>
                  </div>
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
    <div className="min-h-screen bg-[hsl(var(--gray-100))] py-12">
      <div className="max-w-3xl mx-auto px-6">
        <Link
          href={`/e/${slug}`}
          className="inline-flex items-center text-sm text-[hsl(var(--gray-600))] hover:text-[hsl(var(--dark))] mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para o evento
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Finalizar Inscrição</CardTitle>
            <CardDescription>
              Complete os dados para finalizar sua inscrição
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Resumo do Evento */}
            <div className="mb-6 p-4 bg-[hsl(var(--gray-50))] rounded-lg">
              <h3 className="font-semibold text-[hsl(var(--dark))] mb-2">{eventData.name}</h3>
              <p className="text-sm text-[hsl(var(--gray-600))] mb-1">
                Modalidade: <span className="font-medium">{eventData.modality.name}</span>
              </p>
              <p className="text-sm text-[hsl(var(--gray-600))]">
                Data: {new Date(eventData.eventDate).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              
              {/* Preço com descontos */}
              {pricing ? (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[hsl(var(--gray-600))]">Preço base:</span>
                    <span>{new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(pricing.basePrice)}</span>
                  </div>
                  {pricing.batchDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto ({pricing.batchName}):</span>
                      <span>- {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(pricing.batchDiscount)}</span>
                    </div>
                  )}
                  {pricing.couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Cupom ({pricing.couponCode}):</span>
                      <span>- {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(pricing.couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-2 border-t border-[hsl(var(--gray-200))]">
                    <span className="text-[hsl(var(--gray-600))]">Subtotal:</span>
                    <span>{new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(pricing.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[hsl(var(--gray-600))]">Taxa de serviço (10%):</span>
                    <span>{new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(pricing.platformFee)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-[hsl(var(--accent-pink))] pt-2 border-t border-[hsl(var(--gray-200))]">
                    <span>Total:</span>
                    <span>{new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(pricing.total)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-lg font-bold text-[hsl(var(--accent-pink))] mt-2">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(eventData.modality.price)}
                </p>
              )}
            </div>

            {/* Dados do Participante */}
            <div className="mb-6 p-4 border border-[hsl(var(--gray-200))] rounded-lg">
              <h4 className="font-medium text-[hsl(var(--dark))] mb-3">Seus Dados</h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-[hsl(var(--gray-600))]">Nome:</span> {participant?.fullName}</p>
                <p><span className="text-[hsl(var(--gray-600))]">Email:</span> {participant?.email}</p>
                <p><span className="text-[hsl(var(--gray-600))]">CPF:</span> {participant?.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200 mb-6">
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
                    <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--gray-400))] self-center" />
                  )}
                </div>
                {pricing?.couponCode && (
                  <p className="text-sm text-green-600">
                    ✓ Cupom {pricing.couponCode} aplicado! Desconto de{' '}
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(pricing.couponDiscount)}
                  </p>
                )}
                {couponCode && !pricing?.couponCode && !validatingCoupon && (
                  <p className="text-sm text-red-600">
                    Cupom inválido ou não aplicável para esta modalidade
                  </p>
                )}
              </div>

              {/* Campos Opcionais */}
              <div className="space-y-4">
                <h4 className="font-medium text-[hsl(var(--dark))]">Informações Adicionais (Opcionais)</h4>

                {eventData?.kit?.includeShirt && (
                  <div className="space-y-2">
                    <Label htmlFor="shirtSize">
                      Tamanho da Camisa
                      {eventData.kit.shirtRequired && <span className="text-red-600 ml-1">*</span>}
                    </Label>
                    <select
                      id="shirtSize"
                      {...register('shirtSize', {
                        required: eventData.kit.shirtRequired
                          ? 'Tamanho da camiseta é obrigatório'
                          : false,
                      })}
                      className="w-full px-3 py-2 border border-[hsl(var(--gray-300))] rounded-md"
                      disabled={isLoading}
                    >
                      <option value="">
                        {eventData.kit.shirtRequired ? 'Selecione o tamanho' : 'Selecione (opcional)'}
                      </option>
                      {eventData.kit.availableSizes && eventData.kit.availableSizes.length > 0 ? (
                        eventData.kit.availableSizes.map((size) => (
                          <option key={size.size} value={size.size}>
                            {size.size} {size.available > 0 ? `(${size.available} disponível${size.available > 1 ? 'eis' : ''})` : '(Esgotado)'}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="PP">PP</option>
                          <option value="P">P</option>
                          <option value="M">M</option>
                          <option value="G">G</option>
                          <option value="GG">GG</option>
                          <option value="XG">XG</option>
                        </>
                      )}
                    </select>
                    {errors.shirtSize && (
                      <p className="text-sm text-red-600">{errors.shirtSize.message}</p>
                    )}
                    {eventData.kit.items && eventData.kit.items.length > 0 && (
                      <p className="text-xs text-[hsl(var(--gray-600))] mt-1">
                        Kit inclui: {eventData.kit.items.filter((item) => item.included).map((item) => item.name).join(', ')}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Contato de Emergência</Label>
                  <Input
                    id="emergencyContact"
                    placeholder="Nome do contato"
                    {...register('emergencyContact')}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Telefone de Emergência</Label>
                  <Input
                    id="emergencyPhone"
                    placeholder="(00) 00000-0000"
                    {...register('emergencyPhone')}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicalInfo">Informações Médicas</Label>
                  <Textarea
                    id="medicalInfo"
                    placeholder="Alergias, medicamentos, restrições..."
                    rows={3}
                    {...register('medicalInfo')}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamName">Nome da Equipe</Label>
                  <Input
                    id="teamName"
                    placeholder="Se for participar em equipe"
                    {...register('teamName')}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Aceites Obrigatórios */}
              <div className="space-y-3 pt-4 border-t border-[hsl(var(--gray-200))]">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="termsAccepted"
                    {...register('termsAccepted')}
                    disabled={isLoading}
                    className="mt-1"
                  />
                  <label htmlFor="termsAccepted" className="text-sm text-[hsl(var(--gray-700))]">
                    Aceito os{' '}
                    <a href="/termos" target="_blank" className="text-[hsl(var(--accent-pink))] hover:underline">
                      termos de uso
                    </a>{' '}
                    e regulamento do evento *
                  </label>
                </div>
                {errors.termsAccepted && (
                  <p className="text-sm text-red-600">{errors.termsAccepted.message}</p>
                )}

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="dataPrivacyAccepted"
                    {...register('dataPrivacyAccepted')}
                    disabled={isLoading}
                    className="mt-1"
                  />
                  <label htmlFor="dataPrivacyAccepted" className="text-sm text-[hsl(var(--gray-700))]">
                    Aceito a{' '}
                    <a href="/privacidade" target="_blank" className="text-[hsl(var(--accent-pink))] hover:underline">
                      política de privacidade
                    </a>{' '}
                    *
                  </label>
                </div>
                {errors.dataPrivacyAccepted && (
                  <p className="text-sm text-red-600">{errors.dataPrivacyAccepted.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isLoading} className="w-full" size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Ir para Pagamento'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
