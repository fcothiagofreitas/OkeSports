'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { apiPost } from '@/lib/api';
import { fetchAddressByCep } from '@/lib/cep';
import { ArrowLeft, ArrowRight, Calendar, MapPin } from 'lucide-react';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { ModalityManager } from '@/components/features/events/ModalityManager';

const STORAGE_KEY = 'event-draft-form';

const eventSchema = z
  .object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
    shortDescription: z.string().optional(),
    eventDate: z.string().min(1, 'Data do evento é obrigatória'),
    registrationStart: z.string().min(1, 'Data de início das inscrições é obrigatória'),
    registrationEnd: z.string().min(1, 'Data de fim das inscrições é obrigatória'),
    city: z.string().min(2, 'Cidade é obrigatória'),
    state: z.string().length(2, 'Estado deve ter 2 caracteres (ex: SP)'),
    address: z.string().optional(),
    neighborhood: z.string().optional(),
    zipCode: z.string().optional(),
    allowGroupReg: z.boolean().default(true),
    maxGroupSize: z.number().int().min(1).max(100).default(10).optional(),
  })
  .superRefine((data, ctx) => {
    const eventDate = new Date(data.eventDate);
    const regStart = new Date(data.registrationStart);
    const regEnd = new Date(data.registrationEnd);

    if (regStart >= regEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['registrationEnd'],
        message: 'Fim das inscrições deve ser depois do início das inscrições',
      });
    }

    if (regEnd > eventDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['registrationEnd'],
        message: 'Fim das inscrições deve ser no máximo na data do evento',
      });
    }
  });

type EventFormData = z.infer<typeof eventSchema>;
type TabType = 'info' | 'modalities' | 'batches' | 'coupons';

export default function NewEventPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      allowGroupReg: true,
      maxGroupSize: 10,
    },
  });

  // Carregar rascunho do localStorage ao montar
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        reset(draftData);
        setHasDraft(true);
      } catch (error) {
        console.error('Erro ao carregar rascunho:', error);
      }
    }
  }, [reset]);

  // Ajustar fim das inscrições para 5 dias antes do evento quando a data do evento mudar
  const eventDate = watch('eventDate');
  useEffect(() => {
    if (!eventDate) return;
    const d = new Date(eventDate + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return;
    d.setDate(d.getDate() - 5);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setValue('registrationEnd', `${y}-${m}-${day}`);
  }, [eventDate, setValue]);

  // Auto-save: salvar no localStorage quando os campos mudarem
  useEffect(() => {
    const subscription = watch((formData) => {
      // Só salvar se pelo menos um campo foi preenchido
      if (formData.name || formData.description) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      }
    });

    return () => subscription.unsubscribe();
  }, [watch]);

  const onSubmitBasicInfo = async (data: EventFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Converter datas para ISO datetime
      const eventDateISO = new Date(data.eventDate + 'T08:00:00').toISOString();
      const regStartISO = new Date(data.registrationStart + 'T00:00:00').toISOString();
      const regEndISO = new Date(data.registrationEnd + 'T23:59:59').toISOString();

      const requestData = {
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription || data.description.substring(0, 100),
        eventDate: eventDateISO,
        registrationStart: regStartISO,
        registrationEnd: regEndISO,
        status: 'DRAFT' as const,
        allowGroupReg: data.allowGroupReg ?? true,
        maxGroupSize: data.maxGroupSize ?? 10,
        location: {
          street: data.address || 'Não informado',
          number: 'S/N',
          neighborhood: data.neighborhood || 'Centro',
          city: data.city,
          state: data.state.toUpperCase(),
          cep: data.zipCode || '00000-000',
        },
      };

      const result = await apiPost('/api/events', requestData);

      // Limpar rascunho do localStorage após sucesso
      localStorage.removeItem(STORAGE_KEY);

      // Salvar ID do evento criado e ir para próxima aba
      setCreatedEventId(result.id);
      setActiveTab('modalities');
    } catch (err: any) {
      console.error('❌ Erro completo:', err);

      if (err.status !== 401) {
        if (err.data?.details) {
          const validationErrors = err.data.details
            .map((e: any) => `${e.path?.join('.')}: ${e.message}`)
            .join(' | ');
          setError(`Dados inválidos: ${validationErrors}`);
        } else {
          setError(err.message || 'Erro ao criar evento');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearDraft = () => {
    if (confirm('Tem certeza que deseja limpar o rascunho salvo?')) {
      localStorage.removeItem(STORAGE_KEY);
      reset({});
      setHasDraft(false);
    }
  };

  const handleFinish = () => {
    if (createdEventId) {
      router.push(`/app/events/${createdEventId}/edit`);
    }
  };

  const handleCepBlur = async () => {
    const cep = watch('zipCode');
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      setCepError(null);
      return;
    }
    setCepError(null);
    setCepLoading(true);
    try {
      const address = await fetchAddressByCep(cep);
      if (address) {
        setValue('address', address.street);
        setValue('neighborhood', address.neighborhood);
        setValue('city', address.city);
        setValue('state', address.state);
      } else {
        setCepError('CEP não encontrado');
      }
    } catch {
      setCepError('Erro ao buscar CEP');
    } finally {
      setCepLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--gray-100))]">
      <DashboardNav />

      {/* Header */}
      <div className="border-b border-[hsl(var(--gray-200))] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
          <Link
            href="/app/events"
            className="mb-4 inline-flex items-center text-sm text-[hsl(var(--gray-700))] hover:text-[hsl(var(--dark))] cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para eventos
          </Link>
          <h1 className="text-3xl font-bold text-[hsl(var(--dark))] sm:text-4xl font-sans">
            Novo Evento
          </h1>
          <p className="mt-2 text-base text-[hsl(var(--gray-700))] sm:text-lg">
            Siga as etapas para criar seu evento esportivo
          </p>
        </div>
      </div>

      {/* Tabs de Navegação - Sticky */}
      <div className="sticky top-0 z-40 border-b border-[hsl(var(--gray-200))] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('info')}
              disabled={true}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'info'
                  ? 'border-b-2 border-[hsl(var(--dark))] text-[hsl(var(--dark))]'
                  : 'text-[hsl(var(--gray-700))] cursor-not-allowed'
              }`}
            >
              Informações Básicas
            </button>
            <button
              onClick={() => createdEventId && setActiveTab('modalities')}
              disabled={!createdEventId}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'modalities'
                  ? 'border-b-2 border-[hsl(var(--dark))] text-[hsl(var(--dark))]'
                  : createdEventId
                    ? 'rounded-t-md text-[hsl(var(--gray-700))] hover:text-[hsl(var(--dark))] hover:bg-[hsl(var(--gray-50))] cursor-pointer'
                    : 'text-[hsl(var(--gray-700))] cursor-not-allowed'
              }`}
            >
              Modalidades
            </button>
            <button
              disabled
              className="px-6 py-3 text-sm font-medium text-[hsl(var(--gray-700))] cursor-not-allowed"
            >
              Lotes
            </button>
            <button
              disabled
              className="px-6 py-3 text-sm font-medium text-[hsl(var(--gray-700))] cursor-not-allowed"
            >
              Cupons
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        {/* Etapa 1: Informações Básicas */}
        {activeTab === 'info' && (
          <Card className="p-6">
            <form onSubmit={handleSubmit(onSubmitBasicInfo)} className="space-y-6">
              {hasDraft && (
                <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 border border-blue-200 flex items-center justify-between">
                  <span>ℹ️ Rascunho restaurado automaticamente.</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearDraft}
                    className="text-xs h-auto py-1"
                  >
                    Limpar
                  </Button>
                </div>
              )}

              {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
              )}

              {/* Nome do Evento */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Evento *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Corrida de Rua 10km"
                  {...register('name')}
                  disabled={isLoading}
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição Completa *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva seu evento..."
                  rows={5}
                  {...register('description')}
                  disabled={isLoading}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Data do Evento */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-bold text-[hsl(var(--dark))]">
                  <Calendar className="h-5 w-5" />
                  Datas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Data do Evento *</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      {...register('eventDate')}
                      disabled={isLoading}
                    />
                    {errors.eventDate && (
                      <p className="text-sm text-red-600">{errors.eventDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationStart">Início Inscrições *</Label>
                    <Input
                      id="registrationStart"
                      type="date"
                      {...register('registrationStart')}
                      disabled={isLoading}
                    />
                    {errors.registrationStart && (
                      <p className="text-sm text-red-600">{errors.registrationStart.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationEnd">Fim Inscrições *</Label>
                    <Input
                      id="registrationEnd"
                      type="date"
                      {...register('registrationEnd')}
                      disabled={isLoading}
                    />
                    {errors.registrationEnd && (
                      <p className="text-sm text-red-600">{errors.registrationEnd.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Localização */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-neutral-charcoal flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Localização
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    placeholder="00000-000"
                    {...register('zipCode')}
                    onBlur={handleCepBlur}
                    disabled={isLoading}
                  />
                  {cepLoading && (
                    <p className="text-sm text-[hsl(var(--gray-700))]">Buscando endereço...</p>
                  )}
                  {cepError && <p className="text-sm text-red-600">{cepError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço (logradouro)</Label>
                  <Input
                    id="address"
                    placeholder="Rua, avenida..."
                    {...register('address')}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    placeholder="Bairro"
                    {...register('neighborhood')}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      placeholder="São Paulo"
                      {...register('city')}
                      disabled={isLoading}
                    />
                    {errors.city && <p className="text-sm text-red-600">{errors.city.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado (UF) *</Label>
                    <Input
                      id="state"
                      placeholder="SP"
                      maxLength={2}
                      {...register('state')}
                      disabled={isLoading}
                    />
                    {errors.state && <p className="text-sm text-red-600">{errors.state.message}</p>}
                  </div>
                </div>
              </div>

              {/* Configurações de Inscrição */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[hsl(var(--dark))]">
                  Configurações de Inscrição
                </h3>

                <div className="space-y-4 rounded-md border border-[hsl(var(--gray-200))] bg-[hsl(var(--gray-50))] p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="allowGroupReg"
                      defaultChecked={true}
                      {...register('allowGroupReg')}
                      disabled={isLoading}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="allowGroupReg" className="font-bold cursor-pointer">
                        Permitir inscrição de terceiros
                      </Label>
                      <p className="mt-1 text-sm text-[hsl(var(--gray-700))]">
                        Permite que participantes inscrevam outras pessoas na mesma compra
                      </p>
                    </div>
                  </div>

                  {watch('allowGroupReg') && (
                    <div className="space-y-2 ml-7">
                      <Label htmlFor="maxGroupSize">Máximo de pessoas por compra</Label>
                      <Input
                        id="maxGroupSize"
                        type="number"
                        min="1"
                        max="100"
                        defaultValue={10}
                        {...register('maxGroupSize', {
                          valueAsNumber: true,
                        })}
                        disabled={isLoading}
                        className="w-32"
                      />
                      <p className="text-xs text-[hsl(var(--gray-700))]">
                        Limite de participantes que podem ser inscritos em uma única compra (mínimo:
                        1, máximo: 100)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-4 pt-6">
                <Link href="/app/events" className="flex-1">
                  <Button type="button" variant="outline" disabled={isLoading} className="w-full">
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading} className="flex-1 gap-2">
                  {isLoading ? 'Salvando...' : 'Próximo'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Etapa 2: Modalidades */}
        {activeTab === 'modalities' && createdEventId && (
          <Card className="p-6">
            <ModalityManager eventId={createdEventId} />

            <div className="mt-6 flex gap-4 border-t border-[hsl(var(--gray-200))] pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('info')}
                className="flex-1 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button type="button" onClick={handleFinish} className="flex-1">
                Finalizar
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
