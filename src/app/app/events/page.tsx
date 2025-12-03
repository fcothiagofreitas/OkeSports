'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { apiGet, apiDelete, ApiError } from '@/lib/api';
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Edit,
  Trash2,
  Link2,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { DashboardNav } from '@/components/layout/DashboardNav';

interface Event {
  id: string;
  name: string;
  slug: string;
  description: string;
  eventDate: string;
  registrationEnd: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  location?: {
    city: string;
    state: string;
  };
  _count: {
    modalities: number;
    registrations: number;
  };
}

export default function EventsPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'CANCELLED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [statusFilter, searchTerm]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }
      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const url = `/api/events${params.toString() ? `?${params.toString()}` : ''}`;
      const data = await apiGet<{ events: Event[] }>(url);
      setEvents(data.events);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // Redireciona automaticamente para login
        return;
      }
      console.error('Erro ao buscar eventos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (event: Event) => {
    if (typeof window === 'undefined') {
      return;
    }

    const publicUrl = `${window.location.origin}/e/${event.slug}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedEventId(event.id);
    setTimeout(() => setCopiedEventId(null), 2000);
  };

  const filteredEvents = events;

  const InfoItem = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-[0.08em] text-[hsl(var(--gray-500))]">{label}</span>
      <span className="text-sm font-medium text-[hsl(var(--dark))]">{value}</span>
    </div>
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const daysUntil = (targetDate: string) => {
    const target = new Date(targetDate).getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja deletar este evento?')) {
      return;
    }

    try {
      await apiDelete(`/api/events/${eventId}`);
      setEvents(events.filter((e) => e.id !== eventId));
    } catch (error) {
      if (error instanceof ApiError) {
        alert(error.message);
      } else {
        alert('Erro ao deletar evento');
      }
      console.error('Erro ao deletar evento:', error);
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

  return (
    <div className="min-h-screen bg-[hsl(var(--gray-100))]">
      <DashboardNav />

      {/* Header */}
      <div className="bg-white border-b border-[hsl(var(--gray-200))]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[hsl(var(--dark))] font-sans">Meus Eventos</h1>
              <p className="text-lg text-[hsl(var(--gray-600))] mt-2">
                Gerencie seus eventos esportivos
              </p>
            </div>
            <Link href="/app/events/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Evento
              </Button>
            </Link>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Todos', value: 'ALL' },
                { label: 'Publicados', value: 'PUBLISHED' },
                { label: 'Rascunhos', value: 'DRAFT' },
                { label: 'Cancelados', value: 'CANCELLED' },
              ].map((filter) => (
                <Button
                  key={filter.value}
                  variant={statusFilter === filter.value ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setStatusFilter(filter.value as typeof statusFilter)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            <div className="w-full lg:w-80">
              <Input
                placeholder="Buscar por nome ou cidade..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-[hsl(var(--gray-600))]">Carregando eventos...</p>
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-[hsl(var(--gray-400))] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[hsl(var(--dark))] mb-2">
                Nenhum evento cadastrado
              </h3>
              <p className="text-[hsl(var(--gray-600))] mb-6">
                Comece criando seu primeiro evento esportivo
              </p>
              <Link href="/app/events/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Evento
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-[hsl(var(--gray-400))] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[hsl(var(--dark))] mb-2">
                    Nenhum evento encontrado
                  </h3>
                  <p className="text-[hsl(var(--gray-600))]">
                    Ajuste os filtros ou cadastre um novo evento.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl line-clamp-1">{event.name}</CardTitle>
                    {getStatusBadge(event.status)}
                  </div>
                  <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem label="Data" value={formatDate(event.eventDate)} />
                      {event.location && (
                        <InfoItem label="Local" value={`${event.location.city}, ${event.location.state}`} />
                      )}
                      <InfoItem label="Inscrições" value={`${event._count.registrations} ${event._count.registrations === 1 ? 'inscrição' : 'inscrições'}`} />
                      <InfoItem
                        label="Modalidades ativas"
                        value={`${event._count.modalities} ${event._count.modalities === 1 ? 'modalidade' : 'modalidades'}`}
                      />
                    </div>

                    {event.status === 'PUBLISHED' && (
                      (() => {
                        const daysToEnd = daysUntil(event.registrationEnd);
                        if (daysToEnd <= 7) {
                          return (
                            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                              <AlertTriangle className="h-4 w-4" />
                              {daysToEnd >= 0
                                ? `Inscrições encerram em ${daysToEnd} dia${daysToEnd === 1 ? '' : 's'}`
                                : 'Inscrições encerradas'}
                            </div>
                          );
                        }
                        return null;
                      })()
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Link href={`/app/events/${event.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                      </Link>
                      {event.status === 'PUBLISHED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={() => handleCopyLink(event)}
                        >
                          {copiedEventId === event.id ? (
                            <>
                              <Check className="h-4 w-4" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copiar link
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(event.id)}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {event.status === 'PUBLISHED' && (
                      <Link href={`/e/${event.slug}`} target="_blank">
                        <Button variant="ghost" size="sm" className="w-full gap-2 text-[hsl(var(--accent-pink))]">
                          <Link2 className="h-4 w-4" />
                          Ver página pública
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
