import { notFound } from 'next/navigation';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Trophy,
  ShieldCheck,
  HeartPulse,
  ArrowRight,
  Share2,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RegistrationButton } from '@/components/events/RegistrationButton';

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
  const today = new Date();
  const daysToEvent = Math.max(0, Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const daysToClose = Math.max(0, Math.ceil((regEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const hasModalities = event.modalities.length > 0;
  const cheapestModality = hasModalities
    ? event.modalities.reduce((prev: any, curr: any) => (curr.price < prev.price ? curr : prev), event.modalities[0])
    : null;
  const priceFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const priceLabel = cheapestModality
    ? cheapestModality.price === 0
      ? 'Gratuito'
      : priceFormatter.format(cheapestModality.price)
    : 'Inscrições em breve';
  const publicUrl =
    (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '') + `/e/${event.slug}`;
  const heroModalities = event.modalities;

  const sellingPoints = [
    {
      icon: Trophy,
      title: 'Percurso premiado',
      description: 'Circuito oficial com largada rápida e chegada cinematográfica.',
    },
    {
      icon: ShieldCheck,
      title: 'Segurança completa',
      description: 'Staff, sinalização e apoio médico em todo o trajeto.',
    },
    {
      icon: HeartPulse,
      title: 'Experiência completa',
      description: 'Kit premium, pós-prova com ativações e cobertura fotográfica.',
    },
  ];

  const faq = [
    {
      question: 'Como funciona a retirada de kits?',
      answer: 'Você receberá o e-mail com local e horários assim que a inscrição for confirmada.',
    },
    {
      question: 'Posso transferir minha inscrição?',
      answer: 'Sim, até 7 dias antes do evento. Solicite via suporte do organizador.',
    },
    {
      question: 'Quais são as formas de pagamento?',
      answer: 'Cartão de crédito, PIX e boleto (quando disponível).',
    },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--gray-50))]">
      <nav className="bg-white/80 backdrop-blur border-b border-[hsl(var(--gray-200))] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[hsl(var(--accent-pink))] font-sans">🏃 Okê Sports</h1>
          <div className="hidden md:flex items-center gap-6 text-sm text-[hsl(var(--gray-600))]">
            <span>{event.location ? `${event.location.city}, ${event.location.state}` : 'Evento esportivo'}</span>
            <span>{eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span>
          </div>
        </div>
      </nav>

      <header className="relative isolate overflow-hidden bg-gradient-to-b from-[hsl(var(--dark))] via-[hsl(var(--dark))]/90 to-white text-white">
        <div className="absolute inset-0 opacity-40">
          {(event.coverUrl || event.bannerUrl) && (
            <img src={event.coverUrl || event.bannerUrl} alt={event.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-16 space-y-8">
          <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-white">
            <Badge variant="secondary" className="bg-white/10 border-white/25 text-white rounded-xl px-4 py-2">
              {eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Badge>
            {event.location && (
              <Badge variant="secondary" className="bg-white/10 border-white/25 text-white rounded-xl px-4 py-2">
                {event.location.city}, {event.location.state}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-white/10 border-white/25 text-white rounded-xl px-4 py-2">
              Faltam {daysToEvent} dia{daysToEvent === 1 ? '' : 's'}
            </Badge>
            <Badge
              variant="secondary"
              className={
                event.isRegistrationOpen
                  ? 'bg-emerald-500 text-white border-emerald-400 rounded-xl px-4 py-2'
                  : 'bg-white/10 text-white rounded-xl px-4 py-2'
              }
            >
              {event.isRegistrationOpen ? 'Inscrições abertas' : 'Inscrições encerradas'}
            </Badge>
          </div>

          <div className="py-8">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-2">{event.name}</h1>
            {event.shortDescription && <p className="text-lg text-white/80 max-w-3xl">{event.shortDescription}</p>}
          </div>

          {heroModalities.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {heroModalities.map((modality: any) => (
                <div
                  key={modality.id}
                  className="rounded-3xl bg-white text-[hsl(var(--dark))] shadow-lg border border-[hsl(var(--gray-200))] p-6 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xl font-semibold">{modality.name}</p>
                      {modality.description && (
                        <p className="text-sm text-[hsl(var(--gray-600))] mt-1">{modality.description}</p>
                      )}
                    </div>
                    {modality.isSoldOut ? (
                      <Badge variant="secondary">Esgotado</Badge>
                    ) : modality.price === 0 ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                        Gratuita
                      </Badge>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--gray-500))] mb-1">Valor</p>
                    <p className="text-2xl font-bold">
                      {modality.price === 0 ? 'Gratuito' : priceFormatter.format(modality.price)}
                    </p>
                  </div>
                  {modality.maxSlots && (
                    <p className="text-xs text-[hsl(var(--gray-500))]">
                      {modality.availableSlots} de {modality.maxSlots} vagas
                    </p>
                  )}
                  <RegistrationButton
                    eventSlug={event.slug}
                    modalityId={modality.id}
                    modalityName={modality.name}
                    isDisabled={!event.isRegistrationOpen || modality.isSoldOut}
                    disabledReason={
                      modality.isSoldOut ? 'Esgotado' : !event.isRegistrationOpen ? 'Inscrições Encerradas' : undefined
                    }
                    labelOverride={event.isRegistrationOpen ? 'Inscreva-se' : undefined}
                    className="mt-4"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-12 space-y-16">
        <section className="grid gap-6 md:grid-cols-3">
          {sellingPoints.map((point) => (
            <Card key={point.title} className="border-[hsl(var(--gray-200))] shadow-sm rounded-3xl">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-full bg-[hsl(var(--accent-pink))]/10 flex items-center justify-center mb-4">
                  <point.icon className="h-6 w-6 text-[hsl(var(--accent-pink))]" />
                </div>
                <h3 className="text-lg font-semibold text-[hsl(var(--dark))] mb-2">{point.title}</h3>
                <p className="text-[hsl(var(--gray-600))] text-sm">{point.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="shadow-sm border-[hsl(var(--gray-200))] rounded-3xl">
            <CardHeader>
              <CardTitle>Sobre o evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-[hsl(var(--gray-700))]">
              <p className="whitespace-pre-wrap leading-relaxed">{event.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[hsl(var(--gray-200))] p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--gray-500))] mb-2">
                    Cronograma
                  </p>
                  <ul className="space-y-3 text-sm">
                    <li>
                      <span className="font-semibold text-[hsl(var(--dark))]">Inscrições</span>
                      <p className="text-[hsl(var(--gray-600))]">
                        {regStart.toLocaleDateString('pt-BR')} até {regEnd.toLocaleDateString('pt-BR')}
                      </p>
                    </li>
                    <li>
                      <span className="font-semibold text-[hsl(var(--dark))]">Retirada de kit</span>
                      <p className="text-[hsl(var(--gray-600))]">Informações enviadas por e-mail após confirmação.</p>
                    </li>
                    <li>
                      <span className="font-semibold text-[hsl(var(--dark))]">Largada</span>
                      <p className="text-[hsl(var(--gray-600))]">
                        {eventDate.toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                        })}
                      </p>
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-[hsl(var(--gray-200))] p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--gray-500))] mb-2">
                    Inclui
                  </p>
                  <ul className="space-y-2 text-sm text-[hsl(var(--gray-600))]">
                    <li>• Camiseta oficial e número de peito</li>
                    <li>• Hidratação e suporte médico</li>
                    <li>• Medalha finisher exclusiva</li>
                    <li>• Fotos oficiais (quando disponíveis)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-[hsl(var(--gray-200))] rounded-3xl">
            <CardHeader>
              <CardTitle>Localização</CardTitle>
              <CardDescription>
                Garanta tempo para chegar com tranquilidade e aproveite o ambiente pré-prova.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-[hsl(var(--gray-100))] border border-[hsl(var(--gray-200))] p-4 text-sm">
                {event.location ? (
                  <>
                    <p className="font-semibold text-[hsl(var(--dark))]">{event.location.city}</p>
                    <p className="text-[hsl(var(--gray-600))]">{event.location.state}</p>
                  </>
                ) : (
                  <p className="text-[hsl(var(--gray-500))]">Local a ser divulgado em breve.</p>
                )}
              </div>
              <div className="rounded-2xl border border-[hsl(var(--gray-200))] p-4 bg-white space-y-3 text-sm text-[hsl(var(--gray-600))]">
                <p className="font-semibold text-[hsl(var(--dark))]">Dicas rápidas</p>
                <p>• Chegue com pelo menos 1h de antecedência.</p>
                <p>• Opte por transporte compartilhado para evitar bloqueios.</p>
                <p>• Siga as orientações de staff e placas de acesso.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {event.isRegistrationOpen && daysToClose <= 3 && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-5 flex flex-wrap gap-3 items-center text-amber-900 shadow-sm">
            <AlertTriangle className="h-5 w-5" />
            Restam apenas {daysToClose} dia{daysToClose === 1 ? '' : 's'} para encerrar as inscrições. Garanta sua vaga!
            {cheapestModality && (
              <RegistrationButton
                eventSlug={event.slug}
                modalityId={cheapestModality.id}
                modalityName={cheapestModality.name}
                isDisabled={false}
                className="ml-auto px-6"
              />
            )}
          </div>
        )}

        <section>
          <div className="flex flex-col gap-3 mb-6">
            <p className="text-sm uppercase tracking-[0.3em] text-[hsl(var(--gray-500))]">FAQ</p>
            <h2 className="text-3xl font-bold text-[hsl(var(--dark))]">Dúvidas frequentes</h2>
          </div>
          <div className="space-y-4">
            {faq.map((item) => (
              <details
                key={item.question}
                className="rounded-2xl border border-[hsl(var(--gray-200))] bg-white p-5 shadow-sm"
              >
                <summary className="cursor-pointer text-lg font-semibold text-[hsl(var(--dark))]">
                  {item.question}
                </summary>
                <p className="mt-3 text-[hsl(var(--gray-600))]">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="text-center border border-dashed border-[hsl(var(--gray-300))] rounded-3xl p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-[hsl(var(--gray-500))] mb-2">Precisa de ajuda?</p>
          <h3 className="text-2xl font-semibold text-[hsl(var(--dark))] mb-4">Fale com nossa equipe</h3>
          <p className="text-[hsl(var(--gray-600))] mb-6">
            Tire dúvidas sobre modalidades, pagamentos ou suporte no dia da prova.
          </p>
          <a
            href="mailto:contato@okesports.com?subject=Ajuda%20com%20inscrição"
            className="inline-flex items-center justify-center rounded-full bg-[hsl(var(--dark))] px-6 py-3 text-white text-sm font-semibold hover:bg-black"
          >
            Enviar e-mail
          </a>
        </div>
      </main>

      <footer className="text-center text-sm text-[hsl(var(--gray-600))] py-10 border-t border-[hsl(var(--gray-200))]">
        <p>Powered by Okê Sports • Faça sua prova acontecer.</p>
      </footer>

      {event.isRegistrationOpen && cheapestModality && (
        <div className="md:hidden fixed bottom-4 inset-x-0 px-4 z-40">
          <RegistrationButton
            eventSlug={event.slug}
            modalityId={cheapestModality.id}
            modalityName={cheapestModality.name}
            isDisabled={false}
            className="w-full shadow-lg"
            labelOverride="Garantir minha vaga"
          />
        </div>
      )}
    </div>
  );
}
