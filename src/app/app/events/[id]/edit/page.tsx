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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { ArrowLeft, Calendar, Users, ExternalLink, Copy, Check, Trash2, Plus } from 'lucide-react';
import { apiGet, apiPatch, ApiError } from '@/lib/api';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { ModalityManager } from '@/components/features/events/ModalityManager';
import { BatchManager } from '@/components/features/events/BatchManager';
import { CouponManager } from '@/components/features/events/CouponManager';
import { KitManager } from '@/components/features/events/KitManager';
import { RegistrationsManager } from '@/components/features/events/RegistrationsManager';
import { IconSelector } from '@/components/features/events/IconSelector';
import { getIconByKey } from '@/constants/landingIcons';
import { cn } from '@/lib/utils';

const eventSchema = z
  .object({
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
  landingSellingPoints?: LandingSellingPoint[] | null;
  landingAbout?: LandingAbout | null;
  landingFaq?: LandingFaqItem[] | null;
  supportEmail?: string | null;
  supportWhatsapp?: string | null;
}

interface LandingSellingPoint {
  title: string;
  description: string;
  icon?: LandingIconKey | '';
}

interface LandingAbout {
  description?: string;
  includes?: string[];
  tips?: string[];
}

interface LandingFaqItem {
  question: string;
  answer: string;
}

type TabType = 'overview' | 'info' | 'landing' | 'modalities' | 'batches' | 'coupons' | 'kit' | 'registrations';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const { accessToken } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [copied, setCopied] = useState(false);
  const [sellingPoints, setSellingPoints] = useState<LandingSellingPoint[]>([]);
  const [aboutDescription, setAboutDescription] = useState('');
  const [aboutIncludes, setAboutIncludes] = useState('');
  const [aboutTips, setAboutTips] = useState('');
  const [faqItems, setFaqItems] = useState<LandingFaqItem[]>([]);
  const [supportEmail, setSupportEmail] = useState('');
  const [supportWhatsapp, setSupportWhatsapp] = useState('');
  const [isSavingLanding, setIsSavingLanding] = useState(false);

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
      const points = Array.isArray(data.landingSellingPoints)
        ? (data.landingSellingPoints as LandingSellingPoint[])
        : [];
      const placeholders = Array.from({ length: 3 }, () => ({ title: '', description: '', icon: '' }));
      const normalizedPoints = [...points, ...placeholders].slice(0, 3);
      setSellingPoints(normalizedPoints);
      setAboutDescription(data.landingAbout?.description || '');
      setAboutIncludes((data.landingAbout?.includes || []).join('\n'));
      setAboutTips((data.landingAbout?.tips || []).join('\n'));
      const faq =
        Array.isArray(data.landingFaq) && data.landingFaq.length
          ? (data.landingFaq as LandingFaqItem[])
          : [{ question: '', answer: '' }];
      setFaqItems(faq);
      setSupportEmail(data.supportEmail || '');
      setSupportWhatsapp(data.supportWhatsapp || '');
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

      // Converter datas para ISO datetime
      const eventDateISO = new Date(data.eventDate + 'T08:00:00').toISOString();
      const regStartISO = new Date(data.registrationStart + 'T00:00:00').toISOString();
      const regEndISO = new Date(data.registrationEnd + 'T23:59:59').toISOString();

      // Preparar dados com location nested - Schema correto do banco
      const requestData = {
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription || data.description.substring(0, 100),
        eventDate: eventDateISO,
        registrationStart: regStartISO,
        registrationEnd: regEndISO,
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

  const copyPublicLink = () => {
    if (!event?.slug) return;

    const publicUrl = `${window.location.origin}/e/${event.slug}`;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openPublicPage = () => {
    if (!event?.slug) return;
    window.open(`/e/${event.slug}`, '_blank');
  };

  const updateSellingPoint = (index: number, field: keyof LandingSellingPoint, value: string) => {
    setSellingPoints((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleFaqChange = (index: number, field: keyof LandingFaqItem, value: string) => {
    setFaqItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddFaq = () => {
    setFaqItems((prev) => [...prev, { question: '', answer: '' }]);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLandingSave = async () => {
    try {
      setIsSavingLanding(true);
      const parseLines = (text: string) =>
        text
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);

      const sellingPointsPayload = sellingPoints
        .filter((point) => point.title && point.description)
        .map((point) => ({
          title: point.title,
          description: point.description,
          icon: point.icon || undefined,
        }));

      const includesArray = parseLines(aboutIncludes);
      const tipsArray = parseLines(aboutTips);
      const aboutPayload = {
        description: aboutDescription ?? '',
        includes: includesArray,
        tips: tipsArray,
      };

      const faqPayload = faqItems.filter((item) => item.question && item.answer);

      const payload: any = {
        landingSellingPoints: sellingPointsPayload,
        landingAbout: aboutPayload,
        landingFaq: faqPayload,
        supportEmail: supportEmail || null,
        supportWhatsapp: supportWhatsapp || null,
      };

      const result = await apiPatch<Event>(`/api/events/${params.id}`, payload);
      setEvent(result);
      alert('Landing atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar landing:', error);
      if (error instanceof ApiError) {
        const detailMessage =
          error.data?.details?.[0]?.message || (typeof error.data?.error === 'string' ? error.data.error : null);
        alert(detailMessage ? `Erro ao salvar landing: ${detailMessage}` : 'Dados inválidos ao salvar landing.');
      } else {
        alert('Erro ao salvar landing. Tente novamente.');
      }
    } finally {
      setIsSavingLanding(false);
    }
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
            <Link href="/app/events">
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
      <div className="bg-white border-[hsl(var(--gray-200))]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
          <Link
            href="/app/events"
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

          {/* Link Público */}
          {event?.status === 'PUBLISHED' && event?.slug && (
            <div className="mt-6 p-4 bg-[hsl(var(--gray-50))] rounded-lg border border-[hsl(var(--gray-200))]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[hsl(var(--dark))] mb-1">
                    Link Público do Evento
                  </p>
                  <code className="text-sm text-[hsl(var(--gray-600))] break-all">
                    {typeof window !== 'undefined' && `${window.location.origin}/e/${event.slug}`}
                  </code>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPublicLink}
                    className="gap-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openPublicPage}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs de Navegação - Sticky */}
      <div className="bg-white border-b sticky top-0 z-40 ">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-b-2 border-[hsl(var(--dark))] text-[hsl(var(--dark))]'
                  : 'text-[hsl(var(--gray-600))] hover:text-[hsl(var(--dark))] hover:bg-[hsl(var(--gray-50))] rounded-t-lg cursor-pointer'
              }`}
            >
              Geral
            </button>
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
              onClick={() => setActiveTab('landing')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'landing'
                  ? 'border-b-2 border-[hsl(var(--dark))] text-[hsl(var(--dark))]'
                  : 'text-[hsl(var(--gray-600))] hover:text-[hsl(var(--dark))] hover:bg-[hsl(var(--gray-50))] rounded-t-lg cursor-pointer'
              }`}
            >
              Landing
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
            <button
              onClick={() => setActiveTab('batches')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'batches'
                  ? 'border-b-2 border-[hsl(var(--dark))] text-[hsl(var(--dark))]'
                  : 'text-[hsl(var(--gray-600))] hover:text-[hsl(var(--dark))] hover:bg-[hsl(var(--gray-50))] rounded-t-lg cursor-pointer'
              }`}
            >
              Lotes
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'coupons'
                  ? 'border-b-2 border-[hsl(var(--dark))] text-[hsl(var(--dark))]'
                  : 'text-[hsl(var(--gray-600))] hover:text-[hsl(var(--dark))] hover:bg-[hsl(var(--gray-50))] rounded-t-lg cursor-pointer'
              }`}
            >
              Cupons
            </button>
            <button
              onClick={() => setActiveTab('kit')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'kit'
                  ? 'border-b-2 border-[hsl(var(--dark))] text-[hsl(var(--dark))]'
                  : 'text-[hsl(var(--gray-600))] hover:text-[hsl(var(--dark))] hover:bg-[hsl(var(--gray-50))] rounded-t-lg cursor-pointer'
              }`}
            >
              Kit
            </button>
            <button
              onClick={() => setActiveTab('registrations')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'registrations'
                  ? 'border-b-2 border-[hsl(var(--dark))] text-[hsl(var(--dark))]'
                  : 'text-[hsl(var(--gray-600))] hover:text-[hsl(var(--dark))] hover:bg-[hsl(var(--gray-50))] rounded-t-lg cursor-pointer'
              }`}
            >
              Inscritos ({event?._count.registrations || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        {/* Tab: Geral/Overview */}
        {activeTab === 'overview' && event && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wide text-[hsl(var(--gray-500))]">Inscrições confirmadas</p>
                  <p className="text-3xl font-bold text-[hsl(var(--dark))] mt-2">
                    {event._count?.registrations ?? 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase tracking-wide text-[hsl(var(--gray-500))]">Modalidades</p>
                  <p className="text-3xl font-bold text-[hsl(var(--dark))] mt-2">
                    {event._count?.modalities ?? 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-[hsl(var(--gray-500))]">Ações rápidas</p>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyPublicLink}
                      disabled={!event.slug}
                      className="gap-2"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Link copiado' : 'Copiar link público'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openPublicPage}
                      disabled={!event.slug}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir página pública
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

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

        {activeTab === 'landing' && (
          <Card className="p-6 space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[hsl(var(--dark))]">Destaques (Hero)</h3>
              <p className="text-sm text-[hsl(var(--gray-600))]">
                Esses cards aparecem no topo da landing. Preencha até três itens.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sellingPoints.map((point, index) => {
                  return (
                    <div key={index} className="border border-[hsl(var(--gray-200))] rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-[hsl(var(--gray-600))]">Destaque {index + 1}</p>
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        value={point.title || ''}
                        onChange={(e) => updateSellingPoint(index, 'title', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={point.description || ''}
                        onChange={(e) => updateSellingPoint(index, 'description', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ícone (opcional)</Label>
                      <IconSelector
                        value={point.icon || undefined}
                        onChange={(iconKey) => updateSellingPoint(index, 'icon', iconKey)}
                        onClear={() => updateSellingPoint(index, 'icon', '')}
                      />
                    </div>
                  </div>
                );
              })}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[hsl(var(--dark))]">Sobre o evento</h3>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  rows={4}
                  value={aboutDescription}
                  onChange={(e) => setAboutDescription(e.target.value)}
                  placeholder="Texto principal sobre o evento..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Inclui (uma linha por item)</Label>
                  <Textarea
                    rows={4}
                    value={aboutIncludes}
                    onChange={(e) => setAboutIncludes(e.target.value)}
                    placeholder={'Camiseta oficial\nMedalha finisher\nHidratação e frutas'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dicas rápidas (uma linha por item)</Label>
                  <Textarea
                    rows={4}
                    value={aboutTips}
                    onChange={(e) => setAboutTips(e.target.value)}
                    placeholder={'Chegue com 1h de antecedência\nUse protetor solar'}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[hsl(var(--dark))]">FAQ</h3>
              <p className="text-sm text-[hsl(var(--gray-600))]">
                Perguntas frequentes exibidas no final da landing.
              </p>
              <div className="space-y-4">
                {faqItems.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-[hsl(var(--gray-200))] rounded-xl p-4 space-y-3 bg-[hsl(var(--gray-50))]"
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-[hsl(var(--dark))]">Pergunta #{index + 1}</p>
                      {faqItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFaq(index)}
                          className="text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Pergunta</Label>
                      <Input
                        value={faq.question}
                        onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Resposta</Label>
                      <Textarea
                        rows={3}
                        value={faq.answer}
                        onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddFaq} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar FAQ
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-mail de suporte</Label>
                <Input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="contato@evento.com"
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp de suporte</Label>
                <Input
                  value={supportWhatsapp}
                  onChange={(e) => setSupportWhatsapp(e.target.value)}
                  placeholder="+55 11 99999-9999"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={handleLandingSave} disabled={isSavingLanding}>
                {isSavingLanding ? 'Salvando...' : 'Salvar Landing'}
              </Button>
            </div>
          </Card>
        )}

        {/* Tab: Modalidades */}
        {activeTab === 'modalities' && (
          <Card className="p-6">
            <ModalityManager eventId={params.id as string} />
          </Card>
        )}

        {/* Tab: Lotes */}
        {activeTab === 'batches' && (
          <Card className="p-6">
            <BatchManager eventId={params.id as string} />
          </Card>
        )}

        {/* Tab: Cupons */}
        {activeTab === 'coupons' && (
          <Card className="p-6">
            <CouponManager eventId={params.id as string} />
          </Card>
        )}

        {/* Tab: Kit */}
        {activeTab === 'kit' && (
          <Card className="p-6">
            <KitManager eventId={params.id as string} />
          </Card>
        )}

        {/* Tab: Inscrições */}
        {activeTab === 'registrations' && event && (
          <RegistrationsManager eventId={params.id as string} accessToken={accessToken || ''} />
        )}
      </main>
    </div>
  );
}
