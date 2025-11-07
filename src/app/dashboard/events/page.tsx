'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { apiGet, apiDelete, ApiError } from '@/lib/api';
import { Calendar, MapPin, Users, Plus, Edit, Trash2 } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  slug: string;
  description: string;
  eventDate: string;
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

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet<{ events: Event[] }>('/api/events');
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
      {/* Header */}
      <div className="bg-white border-b border-[hsl(var(--gray-200))]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-[hsl(var(--dark))] font-sans">Meus Eventos</h1>
              <p className="text-lg text-[hsl(var(--gray-600))] mt-2">
                Gerencie seus eventos esportivos
              </p>
            </div>
            <Link href="/dashboard/events/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Evento
              </Button>
            </Link>
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
              <Link href="/dashboard/events/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Evento
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl line-clamp-1">{event.name}</CardTitle>
                    {getStatusBadge(event.status)}
                  </div>
                  <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-[hsl(var(--gray-600))]">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(event.eventDate).toLocaleDateString('pt-BR')}
                    </div>
                    {event.location && (
                      <div className="flex items-center text-sm text-[hsl(var(--gray-600))]">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location.city}, {event.location.state}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-[hsl(var(--gray-600))]">
                      <Users className="h-4 w-4 mr-2" />
                      {event._count.registrations} inscrições • {event._count.modalities} modalidades
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/dashboard/events/${event.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(event.id)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
