import { notFound } from 'next/navigation';
import { Calendar, MapPin, Users, DollarSign, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface EventPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getEvent(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const res = await fetch(`${baseUrl}/api/events/by-slug/${slug}`, {
      next: { revalidate: 60 }, // Revalidar a cada 60 segundos
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

export default async function EventPublicPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    notFound();
  }

  const eventDate = new Date(event.eventDate);
  const regStart = new Date(event.registrationStart);
  const regEnd = new Date(event.registrationEnd);

  return (
    <div className="min-h-screen bg-[hsl(var(--gray-100))]">
      {/* Header/Nav simples */}
      <nav className="bg-white border-b border-[hsl(var(--gray-200))]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4">
          <h1 className="text-2xl font-bold text-[hsl(var(--accent-pink))] font-sans">
            🏃 Okê Sports
          </h1>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white border-b border-[hsl(var(--gray-200))]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Imagem do Evento */}
            <div className="relative aspect-video bg-[hsl(var(--gray-200))] rounded-lg overflow-hidden">
              {event.bannerUrl ? (
                <img
                  src={event.bannerUrl}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[hsl(var(--gray-400))]">
                  <Calendar className="h-24 w-24" />
                </div>
              )}
            </div>

            {/* Info Principal */}
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-bold text-[hsl(var(--dark))] mb-4">
                {event.name}
              </h1>

              {event.shortDescription && (
                <p className="text-lg text-[hsl(var(--gray-600))] mb-6">
                  {event.shortDescription}
                </p>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-[hsl(var(--gray-700))]">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">
                    {eventDate.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      weekday: 'long',
                    })}
                  </span>
                </div>

                {event.location && (
                  <div className="flex items-center gap-3 text-[hsl(var(--gray-700))]">
                    <MapPin className="h-5 w-5" />
                    <span>
                      {event.location.city}, {event.location.state}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-[hsl(var(--gray-700))]">
                  <Users className="h-5 w-5" />
                  <span>{event.totalRegistrations} inscritos</span>
                </div>
              </div>

              {/* Status de Inscrição */}
              {event.isRegistrationOpen ? (
                <Badge className="w-fit bg-green-100 text-green-800 border-green-200">
                  ✓ Inscrições Abertas
                </Badge>
              ) : (
                <Badge variant="secondary" className="w-fit">
                  Inscrições Encerradas
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-[hsl(var(--accent-pink))]" />
                <div>
                  <p className="text-sm text-[hsl(var(--gray-600))]">Inscrições até</p>
                  <p className="font-semibold text-[hsl(var(--dark))]">
                    {regEnd.toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-[hsl(var(--accent-pink))]" />
                <div>
                  <p className="text-sm text-[hsl(var(--gray-600))]">Modalidades</p>
                  <p className="font-semibold text-[hsl(var(--dark))]">
                    {event.modalities.length} disponíveis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-[hsl(var(--accent-pink))]" />
                <div>
                  <p className="text-sm text-[hsl(var(--gray-600))]">A partir de</p>
                  <p className="font-semibold text-[hsl(var(--dark))]">
                    {event.modalities.length > 0 && event.modalities[0].price === 0
                      ? 'Gratuito'
                      : new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(event.modalities[0]?.price || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Descrição */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Sobre o Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[hsl(var(--gray-700))] whitespace-pre-wrap">
              {event.description}
            </p>
          </CardContent>
        </Card>

        {/* Modalidades */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[hsl(var(--dark))] mb-4">
            Escolha sua Modalidade
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.modalities.map((modality: any) => (
              <Card key={modality.id} className={modality.isSoldOut ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{modality.name}</CardTitle>
                    {modality.price === 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Gratuita
                      </Badge>
                    )}
                    {modality.isSoldOut && (
                      <Badge variant="secondary">Esgotado</Badge>
                    )}
                  </div>
                  {modality.description && (
                    <CardDescription>{modality.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[hsl(var(--gray-600))]">Valor:</span>
                      <span className="text-xl font-bold text-[hsl(var(--dark))]">
                        {modality.price === 0
                          ? 'Gratuito'
                          : new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(modality.price)}
                      </span>
                    </div>

                    {modality.maxSlots && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[hsl(var(--gray-600))]">Vagas:</span>
                        <span>
                          {modality.availableSlots} de {modality.maxSlots} disponíveis
                        </span>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      disabled={!event.isRegistrationOpen || modality.isSoldOut}
                    >
                      {modality.isSoldOut
                        ? 'Esgotado'
                        : !event.isRegistrationOpen
                        ? 'Inscrições Encerradas'
                        : 'Inscrever-se'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-[hsl(var(--gray-600))] py-8 border-t border-[hsl(var(--gray-200))]">
          <p>Powered by Okê Sports</p>
        </div>
      </div>
    </div>
  );
}
