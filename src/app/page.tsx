import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowRight, CalendarDays, ExternalLink, MapPin, Sparkles } from 'lucide-react';
import { EventStatus } from '@prisma/client';
import prisma from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Okê Sports | Eventos e Corridas do Ceará',
  description:
    'Descubra corridas de rua no Ceará, destaque para eventos com inscrição na OkeSports e publique seu evento em minutos.',
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

type HomeExternalEvent = {
  id: string;
  title: string;
  city: string | null;
  state: string;
  startDate: Date;
  displayPeriod: string | null;
  officialUrl: string | null;
  sourceUrl: string | null;
};

async function getExternalEvents(now: Date): Promise<HomeExternalEvent[]> {
  const externalEventDelegate = (
    prisma as unknown as {
      externalEvent?: {
        findMany: (args: unknown) => Promise<HomeExternalEvent[]>;
      };
    }
  ).externalEvent;

  if (!externalEventDelegate) {
    return [];
  }

  try {
    return await externalEventDelegate.findMany({
      where: {
        status: 'APPROVED',
        startDate: {
          gte: now,
        },
      },
      select: {
        id: true,
        title: true,
        city: true,
        state: true,
        startDate: true,
        displayPeriod: true,
        officialUrl: true,
        sourceUrl: true,
      },
      orderBy: [{ isFeatured: 'desc' }, { startDate: 'asc' }],
      take: 16,
    });
  } catch (error) {
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2021') {
      return [];
    }

    throw error;
  }
}

async function getHomeData() {
  const now = new Date();

  const [platformEvents, externalEvents] = await Promise.all([
    prisma.event.findMany({
      where: {
        status: {
          in: [EventStatus.PUBLISHED, EventStatus.PAUSED, EventStatus.SOLD_OUT],
        },
        eventDate: {
          gte: now,
        },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        shortDescription: true,
        eventDate: true,
        status: true,
        location: {
          select: {
            city: true,
            state: true,
          },
        },
      },
      orderBy: {
        eventDate: 'asc',
      },
      take: 8,
    }),
    getExternalEvents(now),
  ]);

  return { platformEvents, externalEvents };
}

export default async function Home() {
  const { platformEvents, externalEvents } = await getHomeData();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffe4ef_0%,_#fff_40%,_#f9f9ff_100%)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 pb-12 pt-10 md:px-8 md:pt-14">
        <Badge className="w-fit border-0 bg-[hsl(var(--pink-primary))] px-3 py-1 text-white">
          Agenda de Corridas no Ceará
        </Badge>

        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <h1 className="text-4xl leading-tight text-[hsl(var(--dark))] md:text-6xl">
              Corra no Ceará e publique seu evento na Okê Sports.
            </h1>
            <p className="max-w-2xl text-base text-[hsl(var(--gray-700))] md:text-lg">
              Reunimos corridas da OkeSports e do calendário oficial da FCAt em um só lugar. Para
              organizadores, a plataforma já entrega página de evento, modalidades, lotes e
              checkout.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="pink">
                <Link href="/para-organizadores">
                  Criar evento na plataforma
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#agenda-ceara">Ver agenda do Ceará</Link>
              </Button>
            </div>
          </div>

          <Card className="border-[hsl(var(--gray-200))] bg-white/90 shadow-dribbble">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="h-5 w-5 text-[hsl(var(--pink-primary))]" />
                Destaque da plataforma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[hsl(var(--gray-700))]">
                Eventos com inscrição direta na OkeSports têm prioridade aqui.
              </p>
              <div className="rounded-xl border border-[hsl(var(--gray-200))] bg-[hsl(var(--gray-100))] p-4">
                <p className="text-sm font-semibold text-[hsl(var(--gray-800))]">
                  {platformEvents.length} evento(s) com inscrição ativa/publicada
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/cadastro">Quero organizar meu evento</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-10 md:px-8" id="eventos-okesports">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-2xl text-[hsl(var(--dark))] md:text-3xl">
            Eventos cadastrados na OkeSports
          </h2>
          <Badge variant="secondary">Inscrição na plataforma</Badge>
        </div>

        {platformEvents.length === 0 ? (
          <Card className="border-dashed bg-white/80">
            <CardContent className="py-8 text-sm text-[hsl(var(--gray-700))]">
              Nenhum evento publicado no momento. Seja o primeiro a criar sua prova.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {platformEvents.map((event) => (
              <Card key={event.id} className="border-[hsl(var(--gray-200))] bg-white/95">
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="border-0 bg-[hsl(var(--green))] text-[hsl(var(--dark))]">
                      Na OkeSports
                    </Badge>
                    <span className="text-xs text-[hsl(var(--gray-600))]">
                      {formatDate(event.eventDate)}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-2 text-xl leading-snug">{event.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-2 text-sm text-[hsl(var(--gray-700))]">
                    {event.shortDescription ?? 'Detalhes do evento disponíveis na página oficial.'}
                  </p>
                  {event.location ? (
                    <p className="flex items-center gap-1.5 text-xs text-[hsl(var(--gray-600))]">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.location.city}, {event.location.state}
                    </p>
                  ) : null}
                  <Button asChild className="w-full">
                    <Link href={`/e/${event.slug}`}>Ver evento e inscrever-se</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-14 md:px-8" id="agenda-ceara">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-2xl text-[hsl(var(--dark))] md:text-3xl">
            Corridas de rua no Ceará (FCAt)
          </h2>
          <Badge variant="outline" className="border-[hsl(var(--gray-300))]">
            Fonte externa
          </Badge>
        </div>

        {externalEvents.length === 0 ? (
          <Card className="border-dashed bg-white/80">
            <CardContent className="py-8 text-sm text-[hsl(var(--gray-700))]">
              Ainda não sincronizamos os dados da FCAt. Execute o sync para preencher esta agenda.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {externalEvents.map((event) => (
              <Card key={event.id} className="border-[hsl(var(--gray-200))] bg-white/95">
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="secondary"
                      className="border-0 bg-[hsl(var(--yellow))] text-[hsl(var(--dark))]"
                    >
                      FCAt
                    </Badge>
                    <span className="text-xs text-[hsl(var(--gray-600))]">
                      {event.displayPeriod ?? formatDate(event.startDate)}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-2 text-lg leading-snug">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="flex items-center gap-1.5 text-xs text-[hsl(var(--gray-600))]">
                    <MapPin className="h-3.5 w-3.5" />
                    {event.city ?? 'Ceará'}, {event.state}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-[hsl(var(--gray-600))]">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(event.startDate)}
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link
                      href={event.officialUrl ?? event.sourceUrl ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver página oficial
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
