'use client';

import { useEffect, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { ArrowLeft, Calendar, Users } from 'lucide-react';
import { apiGet, apiPatch, ApiError } from '@/lib/api';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { ModalityManager } from '@/components/features/events/ModalityManager';

const eventSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  shortDescription: z.string().optional(),
  eventDate: z.string().min(1, 'Data do evento é obrigatória'),
  registrationStart: z.string().min(1, 'Data de início das inscrições é obrigatória'),
  registrationEnd: z.string().min(1, 'Data de fim das inscrições é obrigatória'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres (ex: SP)'),
  address: z.string().optional(),
  zipCode: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface Event {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  eventDate: string;
  registrationStart: string;
  registrationEnd: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  location?: {
    venueName?: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
  _count: {
    modalities: number;
    registrations: number;
  };
}

type TabType = 'info' | 'modalities' | 'batches' | 'coupons';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const { accessToken } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('info');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  useEffect(() => {
    fetchEvent();
  }, [params.id]);

  const fetchEvent = async () => {
    try {
      setIsFetching(true);
      const data = await apiGet<Event>(`/api/events/${params.id}`);

      setEvent(data);
      // Preencher form com dados do evento
      reset({
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription || '',
        eventDate: data.eventDate.split('T')[0],
        registrationStart: data.registrationStart.split('T')[0],
        registrationEnd: data.registrationEnd.split('T')[0],
        status: data.status,
        city: data.location?.city || '',
        state: data.location?.state || '',
        address: data.location?.street || '',
        zipCode: data.location?.cep || '',
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // apiGet já redireciona para login
        return;
      }
      console.error('Erro ao buscar evento:', error);
      setError(error instanceof ApiError ? error.message : 'Erro ao buscar evento');
    } finally {
      setIsFetching(false);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Preparar dados com location nested - Schema correto do banco
      const requestData = {
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription || data.description.substring(0, 100),
        eventDate: data.eventDate,
        registrationStart: data.registrationStart,
        registrationEnd: data.registrationEnd,
        status: data.status,
        location: {
          street: data.address || 'Não informado',
          number: 'S/N',
          neighborhood: 'Centro',
          city: data.city,
          state: data.state.toUpperCase(),
          cep: data.zipCode || '00000-000',
        },
      };

      const result = await apiPatch<Event>(`/api/events/${params.id}`, requestData);

      // Atualizar evento local
      setEvent(result);
      alert('Evento atualizado com sucesso!');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // apiPatch já redireciona para login
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Tem certeza que deseja publicar este evento?')) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await apiPatch<Event>(`/api/events/${params.id}`, {
        status: 'PUBLISHED',
      });

      setEvent(result);
      alert('Evento publicado com sucesso!');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return;
      }
      console.error('Erro ao publicar evento:', error);
      alert(error instanceof ApiError ? error.message : 'Erro ao publicar evento');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: 'Rascunho', variant: 'secondary' as const },
      PUBLISHED: { label: 'Publicado', variant: 'default' as const },
      CANCELLED: { label: 'Cancelado', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-[hsl(var(--gray-100))] flex items-center justify-center">
        <p className="text-[hsl(var(--gray-600))]">Carregando evento...</p>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-[hsl(var(--gray-100))] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-red-600">{error}</p>
            <Link href="/dashboard/events">
              <Button className="mt-4">Voltar para eventos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--gray-100))]">
      <DashboardNav />

      {/* Header */}
      <div className="bg-white border-b border-[hsl(var(--gray-200))]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-8 pb-0">
          <Link
            href="/dashboard/events"
            className="inline-flex items-center text-sm text-[hsl(var(--gray-600))] hover:text-[hsl(var(--dark))] mb-4 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para eventos
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-[hsl(var(--dark))] font-sans">
                {event?.name}
              </h1>
              <p className="text-lg text-[hsl(var(--gray-600))] mt-2">Editar Evento</p>
            </div>
            <div className="flex gap-3 items-center">
              {getStatusBadge(event?.status || 'DRAFT')}
              {event?.status === 'DRAFT' && (
                <Button onClick={handlePublish} disabled={isLoading} variant="pink">
                  Publicar Evento
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--gray-600))]">
              <Calendar className="h-4 w-4" />
              {event?.eventDate && new Date(event.eventDate).toLocaleDateString('pt-BR')}
            </div>
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--gray-600))]">
              <Users className="h-4 w-4" />
              {event?._count.registrations} inscrições • {event?._count.modalities} modalidades
            </div>
          </div>

          {/* Tabs de Navegação */}
          <div className="flex gap-1 mt-8 border-b border-[hsl(var(--gray-200))]">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'info'
                  ? 'border-b-2 border-[hsl(var(--dark))] text-[hsl(var(--dark))]'
                  : 'text-[hsl(var(--gray-600))] hover:text-[hsl(var(--dark))] hover:bg-[hsl(var(--gray-50))] rounded-t-lg cursor-pointer'
              }`}
            >
              Informações Básicas
            </button>
            <button
              onClick={() => setActiveTab('modalities')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'modalities'
                  ? 'border-b-2 border-[hsl(var(--dark))] text-[hsl(var(--dark))]'
                  : 'text-[hsl(var(--gray-600))] hover:text-[hsl(var(--dark))] hover:bg-[hsl(var(--gray-50))] rounded-t-lg cursor-pointer'
              }`}
            >
              Modalidades ({event?._count.modalities || 0})
            </button>
            <button className="px-6 py-3 font-medium text-sm text-[hsl(var(--gray-400))] cursor-not-allowed">
              Lotes (Em breve)
            </button>
            <button className="px-6 py-3 font-medium text-sm text-[hsl(var(--gray-400))] cursor-not-allowed">
              Cupons (Em breve)
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        {/* Tab: Informações Básicas */}
        {activeTab === 'info' && (
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Edite os dados principais do seu evento</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {error && (
                    <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
                  )}

                  {/* Nome do Evento */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Evento *</Label>
                    <Input id="name" {...register('name')} disabled={isLoading} />
                    {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <select
                      id="status"
                      {...register('status')}
                      disabled={isLoading}
                      className="flex h-11 w-full rounded-full border border-input bg-background px-6 py-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="DRAFT">Rascunho</option>
                      <option value="PUBLISHED">Publicado</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                    {errors.status && (
                      <p className="text-sm text-red-600">{errors.status.message}</p>
                    )}
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição Completa *</Label>
                    <Textarea
                      id="description"
                      rows={5}
                      {...register('description')}
                      disabled={isLoading}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  {/* Datas */}
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

                  {/* Localização */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[hsl(var(--dark))]">Localização</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="city">Cidade *</Label>
                        <Input id="city" {...register('city')} disabled={isLoading} />
                        {errors.city && (
                          <p className="text-sm text-red-600">{errors.city.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">Estado (UF) *</Label>
                        <Input
                          id="state"
                          maxLength={2}
                          {...register('state')}
                          disabled={isLoading}
                        />
                        {errors.state && (
                          <p className="text-sm text-red-600">{errors.state.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço Completo</Label>
                      <Input id="address" {...register('address')} disabled={isLoading} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">CEP</Label>
                      <Input id="zipCode" {...register('zipCode')} disabled={isLoading} />
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-4 pt-6">
                    <Button type="submit" disabled={isLoading} className="flex-1">
                      {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </form>
            </CardContent>
          </Card>
        )}

        {/* Tab: Modalidades */}
        {activeTab === 'modalities' && (
          <Card className="p-6">
            <ModalityManager eventId={params.id as string} />
          </Card>
        )}

        {/* Tab: Lotes (Em breve) */}
        {activeTab === 'batches' && (
          <Card className="p-12 text-center">
            <p className="text-[hsl(var(--gray-600))]">Em breve...</p>
          </Card>
        )}

        {/* Tab: Cupons (Em breve) */}
        {activeTab === 'coupons' && (
          <Card className="p-12 text-center">
            <p className="text-[hsl(var(--gray-600))]">Em breve...</p>
          </Card>
        )}
      </main>
    </div>
  );
}
