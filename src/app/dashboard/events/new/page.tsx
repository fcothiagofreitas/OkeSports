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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { apiPost } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

const STORAGE_KEY = 'event-draft-form';

const eventSchema = z.object({
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
});

type EventFormData = z.infer<typeof eventSchema>;

export default function NewEventPage() {
  const router = useRouter();
  const { accessToken, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

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

  const onSubmit = async (data: EventFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Preparar dados com location nested
      // Converter datas para ISO datetime (adicionar hora)
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

      console.log('📤 Enviando dados:', requestData);
      const result = await apiPost('/api/events', requestData);

      // Limpar rascunho do localStorage após sucesso
      localStorage.removeItem(STORAGE_KEY);

      // Redirecionar para edição do evento
      router.push(`/dashboard/events/${result.id}/edit`);
    } catch (err: any) {
      console.error('❌ Erro completo:', err);
      console.error('📋 err.data:', err.data);
      console.error('💬 err.message:', err.message);
      console.error('🔢 err.status:', err.status);

      // Se token expirado, apiPost já redirecionou para login
      if (err.status !== 401) {
        // Mostrar detalhes do erro de validação se houver
        if (err.data?.details) {
          console.error('🔍 Detalhes de validação:', err.data.details);
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

  return (
    <div className="min-h-screen bg-[hsl(var(--gray-100))]">
      {/* Header */}
      <div className="bg-white border-b border-[hsl(var(--gray-200))]">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-8">
          <Link
            href="/dashboard/events"
            className="inline-flex items-center text-sm text-[hsl(var(--gray-600))] hover:text-[hsl(var(--dark))] mb-4 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para eventos
          </Link>
          <h1 className="text-4xl font-bold text-[hsl(var(--dark))] font-sans">Novo Evento</h1>
          <p className="text-lg text-[hsl(var(--gray-600))] mt-2">
            Preencha os dados básicos do seu evento esportivo
          </p>
        </div>
      </div>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Você poderá adicionar modalidades e lotes na próxima etapa
                </CardDescription>
              </div>
              {hasDraft && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearDraft}
                  className="text-xs"
                >
                  Limpar rascunho
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {hasDraft && (
                <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 border border-blue-200">
                  ℹ️ Rascunho restaurado automaticamente. Seus dados estão sendo salvos enquanto você
                  digita.
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
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Criando...' : 'Criar Evento'}
                </Button>
                <Link href="/dashboard/events" className="flex-1">
                  <Button type="button" variant="outline" disabled={isLoading} className="w-full">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
