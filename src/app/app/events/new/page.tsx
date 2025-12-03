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
    zipCode: z.string().optional(),
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
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
        location: {
          street: data.address || 'Não informado',
          number: 'S/N',
          neighborhood: 'Centro',
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
          const validationErrors = err.data.details.map((e: any) => `${e.path?.join('.')}: ${e.message}`).join(' | ');
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

  return (
    <div className="min-h-screen bg-[hsl(var(--gray-100))]">
      <DashboardNav />

      {/* Header */}
      <div className="bg-white border-b border-[hsl(var(--gray-200))]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
          <Link
            href="/app/events"
            className="inline-flex items-center text-sm text-[hsl(var(--gray-600))] hover:text-[hsl(var(--dark))] mb-4 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para eventos
          </Link>
          <h1 className="text-4xl font-bold text-[hsl(var(--dark))] font-sans">Novo Evento</h1>
          <p className="text-lg text-[hsl(var(--gray-600))] mt-2">
            Siga as etapas para criar seu evento esportivo
          </p>
        </div>
      </div>

      {/* Tabs de Navegação - Sticky */}
      <div className="bg-white border-b border-[hsl(var(--gray-200))] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('info')}
              disabled={true}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'info'
                  ? 'border-b-2 border-[hsl(var(--dark))] text-[hsl(var(--dark))]'
                  : 'text-[hsl(var(--gray-400))] cursor-not-allowed'
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
                  ? 'text-[hsl(var(--gray-600))] hover:text-[hsl(var(--dark))] hover:bg-[hsl(var(--gray-50))] rounded-t-lg cursor-pointer'
                  : 'text-[hsl(var(--gray-400))] cursor-not-allowed'
              }`}
            >
              Modalidades
            </button>
            <button
              disabled
              className="px-6 py-3 font-medium text-sm text-[hsl(var(--gray-400))] cursor-not-allowed"
            >
              Lotes
            </button>
            <button
              disabled
              className="px-6 py-3 font-medium text-sm text-[hsl(var(--gray-400))] cursor-not-allowed"
            >
              Cupons
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
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
                <h3 className="text-lg font-semibold text-[hsl(var(--dark))] flex items-center gap-2">
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
                <h3 className="text-lg font-semibold text-[hsl(var(--dark))] flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Localização
                </h3>

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

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço Completo</Label>
                  <Input
                    id="address"
                    placeholder="Rua, número, bairro..."
                    {...register('address')}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    placeholder="00000-000"
                    {...register('zipCode')}
                    disabled={isLoading}
                  />
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

            <div className="flex gap-4 pt-6 mt-6 border-t border-[hsl(var(--gray-200))]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('info')}
                className="flex-1 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button
                type="button"
                onClick={handleFinish}
                className="flex-1"
              >
                Finalizar
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
