import { notFound } from 'next/navigation';
import { Calendar, MapPin, Mail, MessageCircle, Clock, ChevronRight, Users, CheckCircle } from 'lucide-react';
import { RegistrationButton } from '@/components/events/RegistrationButton';
import { LandingIcon } from '@/components/events/LandingIcon';
import type { LandingIconKey } from '@/constants/landingIcons';
import prisma from '@/lib/db';
import { getActiveBatch } from '@/lib/pricing';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface EventPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface LandingSellingPoint {
  icon?: string;
  title: string;
  description: string;
}

interface LandingAbout {
  description?: string;
  includes?: string[];
  tips?: string[];
}

interface LandingFaq {
  question: string;
  answer: string;
}

function isLandingSellingPoint(value: unknown): value is LandingSellingPoint {
  if (!value || typeof value !== 'object') return false;
  const point = value as Record<string, unknown>;
  return typeof point.title === 'string' && typeof point.description === 'string';
}

function isLandingFaq(value: unknown): value is LandingFaq {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.question === 'string' && typeof item.answer === 'string';
}

async function getEvent(slug: string) {
  try {
    const event = await prisma.event.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: {
        location: true,
        modalities: {
          where: { active: true },
          orderBy: { price: 'asc' },
          include: {
            _count: { select: { registrations: true } },
          },
        },
        kit: {
          include: {
            sizes: {
              orderBy: { size: 'asc' },
            },
          },
        },
        _count: { select: { registrations: true } },
      },
    });

    if (!event) return null;

    const modalitiesWithAvailability = event.modalities.map((modality) => ({
      ...modality,
      availableSlots: modality.maxSlots ? modality.maxSlots - modality._count.registrations : null,
      isSoldOut: modality.maxSlots ? modality._count.registrations >= modality.maxSlots : false,
    }));

    const now = new Date();
    const isRegistrationOpen = now >= event.registrationStart && now <= event.registrationEnd;

    const activeBatch = await getActiveBatch(event.id);
    const activeBatchInfo = activeBatch
      ? {
          id: activeBatch.id,
          name: activeBatch.name,
          discountType: activeBatch.discountType,
          discountValue: activeBatch.discountValue ? Number(activeBatch.discountValue) : null,
        }
      : null;

    return {
      id: event.id,
      slug: event.slug,
      name: event.name,
      description: event.description,
      shortDescription: event.shortDescription,
      eventDate: event.eventDate,
      registrationStart: event.registrationStart,
      registrationEnd: event.registrationEnd,
      location: event.location,
      bannerUrl: event.bannerUrl,
      coverUrl: event.coverUrl,
      modalities: modalitiesWithAvailability,
      totalRegistrations: event._count.registrations,
      isRegistrationOpen,
      landingSellingPoints: event.landingSellingPoints,
      landingAbout: event.landingAbout,
      landingFaq: event.landingFaq,
      supportEmail: event.supportEmail,
      supportWhatsapp: event.supportWhatsapp,
      activeBatch: activeBatchInfo,
      kit: event.kit,
    };
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

function buildPrice(price: number, activeBatch: { discountType: string | null; discountValue: number | null } | null) {
  if (!activeBatch?.discountType || !activeBatch.discountValue) {
    return { base: price, discount: 0, final: price };
  }

  const discount =
    activeBatch.discountType === 'PERCENTAGE'
      ? (price * activeBatch.discountValue) / 100
      : Math.min(activeBatch.discountValue, price);

  return {
    base: price,
    discount,
    final: Math.max(0, price - discount),
  };
}

export default async function EventPublicPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) notFound();

  const eventDate = new Date(event.eventDate);
  const regStart = new Date(event.registrationStart);
  const regEnd = new Date(event.registrationEnd);
  const now = new Date();
  const dayMs = 1000 * 60 * 60 * 24;

  const daysToEvent = Math.max(0, Math.ceil((eventDate.getTime() - now.getTime()) / dayMs));

  const priceFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  const defaultSellingPoints = [
    {
      icon: 'trophy' as LandingIconKey,
      title: 'Percurso premiado',
      description: 'Circuito oficial com largada rápida e chegada cinematográfica.',
    },
    {
      icon: 'shield' as LandingIconKey,
      title: 'Segurança completa',
      description: 'Staff, sinalização e apoio médico em todo o trajeto.',
    },
    {
      icon: 'heart' as LandingIconKey,
      title: 'Experiência completa',
      description: 'Kit premium, pós-prova com ativações e cobertura fotográfica.',
    },
  ];

  const customSellingPoints: LandingSellingPoint[] = Array.isArray(event.landingSellingPoints)
    ? (event.landingSellingPoints.filter(isLandingSellingPoint) as unknown as LandingSellingPoint[])
    : [];
  const sellingPoints = customSellingPoints.length > 0 ? customSellingPoints : defaultSellingPoints;

  const landingAbout: LandingAbout =
    event.landingAbout && typeof event.landingAbout === 'object' && !Array.isArray(event.landingAbout)
      ? (event.landingAbout as LandingAbout)
      : {};

  const aboutDescription =
    landingAbout.description || event.description || event.shortDescription || 'Descrição do evento em breve.';

  const includesFromLanding = Array.isArray(landingAbout.includes) ? landingAbout.includes : [];
  const includesFromKit = Array.isArray(event.kit?.items)
    ? event.kit.items
        .filter((item): item is { name: string } => !!item && typeof item === 'object' && typeof (item as { name?: unknown }).name === 'string')
        .map((item) => item.name)
    : [];
  const includes =
    includesFromLanding.length > 0
      ? includesFromLanding
      : includesFromKit.length > 0
        ? includesFromKit
        : ['Camiseta oficial e número de peito', 'Hidratação e suporte médico', 'Medalha finisher exclusiva'];

  const tips =
    Array.isArray(landingAbout.tips) && landingAbout.tips.length > 0
      ? landingAbout.tips
      : [
          'Chegue com pelo menos 1h de antecedência.',
          'Opte por transporte compartilhado para evitar bloqueios.',
          'Siga as orientações de staff e placas de acesso.',
        ];

  const defaultFaq: LandingFaq[] = [
    {
      question: 'Como funciona a retirada de kits?',
      answer: 'Você receberá as informações por e-mail após confirmação da inscrição.',
    },
    {
      question: 'Posso transferir minha inscrição?',
      answer: 'Sim, respeitando as regras e prazos definidos pela organização.',
    },
    {
      question: 'Quais são as formas de pagamento?',
      answer: 'As formas disponíveis aparecem no checkout da inscrição.',
    },
  ];

  const customFaq: LandingFaq[] = Array.isArray(event.landingFaq)
    ? (event.landingFaq.filter(isLandingFaq) as unknown as LandingFaq[])
    : [];
  const faq = customFaq.length > 0 ? customFaq : defaultFaq;

  const heroImage =
    event.coverUrl ||
    event.bannerUrl ||
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1600&q=80';

  const supportEmail = event.supportEmail || 'contato@okesports.com';
  const supportWhatsapp = event.supportWhatsapp || undefined;
  const whatsappLink = supportWhatsapp ? `https://wa.me/${supportWhatsapp.replace(/\D/g, '')}` : null;

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-black/[0.04] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <p className="text-sm font-bold tracking-wide text-slate-900">OKE SPORTS</p>
          <div className="hidden items-center gap-5 text-[13px] text-slate-500 md:flex">
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {event.location.city}, {event.location.state}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      {/* Hero — full width */}
      <section className="relative overflow-hidden bg-slate-900">
          <div className="absolute inset-0">
            <img
              alt={event.name}
              className="h-full w-full object-cover opacity-40"
              src={heroImage}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 pb-8 pt-10 sm:px-10 sm:pb-10 sm:pt-14 lg:px-14 lg:pt-16">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium sm:text-xs">
              <span className="rounded-full bg-white/10 px-3 py-1.5 uppercase tracking-widest text-white/80 backdrop-blur-sm">
                {eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              {event.location && (
                <span className="rounded-full bg-white/10 px-3 py-1.5 uppercase tracking-widest text-white/80 backdrop-blur-sm">
                  {event.location.city}, {event.location.state}
                </span>
              )}
              <span className="rounded-full bg-white/10 px-3 py-1.5 uppercase tracking-widest text-white/80 backdrop-blur-sm">
                {daysToEvent > 0 ? `Faltam ${daysToEvent} dias` : 'Hoje!'}
              </span>
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-widest ${
                  event.isRegistrationOpen
                    ? 'bg-emerald-500/90 text-white'
                    : 'bg-white/10 text-white/70 backdrop-blur-sm'
                }`}
              >
                {event.isRegistrationOpen ? 'Inscrições abertas' : 'Inscrições encerradas'}
              </span>
            </div>

            <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {event.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base sm:leading-7">
              {aboutDescription}
            </p>

            {/* Modality Cards */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {event.modalities.length > 0 ? (
                event.modalities.map((modality) => {
                  const price = Number(modality.price);
                  const pricing = buildPrice(price, event.activeBatch);

                  return (
                    <article
                      key={modality.id}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.06] p-5 backdrop-blur-md transition-colors hover:bg-white/[0.1]"
                    >
                      <p className="text-lg font-semibold text-white">{modality.name}</p>
                      {modality.description && (
                        <p className="mt-0.5 text-sm text-white/50">{modality.description}</p>
                      )}

                      <div className="mt-4">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">Valor</p>
                        {pricing.discount > 0 && (
                          <p className="mt-0.5 text-xs text-white/40 line-through">
                            {priceFormatter.format(pricing.base)}
                          </p>
                        )}
                        <p className="text-3xl font-bold tracking-tight text-white">
                          {price === 0 ? 'Gratuito' : priceFormatter.format(pricing.final)}
                        </p>
                      </div>

                      <RegistrationButton
                        eventSlug={event.slug}
                        modalityId={modality.id}
                        modalityName={modality.name}
                        isDisabled={!event.isRegistrationOpen || modality.isSoldOut}
                        disabledReason={
                          modality.isSoldOut ? 'Esgotado' : !event.isRegistrationOpen ? 'Inscrições Encerradas' : undefined
                        }
                        labelOverride="Inscreva-se"
                        className="mt-4 h-10 rounded-lg bg-white font-semibold text-slate-900 hover:bg-white/90"
                      />
                    </article>
                  );
                })
              ) : (
                <article className="col-span-full rounded-xl border border-dashed border-white/20 p-8 text-center text-sm text-white/50">
                  Modalidades em breve.
                </article>
              )}
            </div>
          </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Selling Points */}
        <section className="mt-6 grid gap-3 md:grid-cols-3">
          {sellingPoints.map((point, index) => {
            const iconKey = typeof point.icon === 'string' ? (point.icon as LandingIconKey) : undefined;
            const fallbackIconKey = defaultSellingPoints[index % defaultSellingPoints.length].icon;
            return (
              <article
                key={`${point.title}-${index}`}
                className="rounded-2xl border border-black/[0.04] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <LandingIcon className="h-5 w-5 text-emerald-600" iconKey={iconKey || fallbackIconKey} />
                </div>
                <p className="text-base font-semibold text-slate-900">{point.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{point.description}</p>
              </article>
            );
          })}
        </section>

        {/* About + Location */}
        <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border border-black/[0.04] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-xl font-bold text-slate-900">Sobre o evento</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">{aboutDescription}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Cronograma</p>
                </div>
                <ul className="mt-3 space-y-3 text-sm text-slate-600">
                  <li>
                    <span className="font-medium text-slate-900">Inscrições</span>
                    <p className="text-slate-500">
                      {regStart.toLocaleDateString('pt-BR')} até {regEnd.toLocaleDateString('pt-BR')}
                    </p>
                  </li>
                  <li>
                    <span className="font-medium text-slate-900">Largada</span>
                    <p className="text-slate-500">
                      {eventDate.toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                      })}
                    </p>
                  </li>
                </ul>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Inclui</p>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {includes.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-start gap-2">
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-black/[0.04] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-xl font-bold text-slate-900">Localização</h2>
            <p className="mt-1 text-sm text-slate-500">
              Garanta tempo para chegar com tranquilidade.
            </p>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200/70">
                  <MapPin className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {event.location ? event.location.city : 'Local a definir'}
                  </p>
                  <p className="text-xs text-slate-500">{event.location ? event.location.state : ''}</p>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Dicas rápidas</p>
              <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
                {tips.map((tip, index) => (
                  <li key={`${tip}-${index}`} className="flex items-start gap-2">
                    <span className="mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </section>

        {/* FAQ */}
        <section className="mt-6 rounded-2xl border border-black/[0.04] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">FAQ</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Dúvidas frequentes</h2>
          <div className="mt-5 space-y-2">
            {faq.map((item, index) => (
              <details
                key={`${item.question}-${index}`}
                className="group rounded-xl bg-slate-50 transition-colors open:bg-slate-100/80"
                open={index === 0}
              >
                <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
                </summary>
                <p className="px-4 pb-4 text-sm leading-relaxed text-slate-500">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="mt-6 overflow-hidden rounded-2xl bg-slate-900 px-6 py-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Precisa de ajuda?</p>
          <h3 className="mt-2 text-2xl font-bold text-white">Fale com nossa equipe</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
            Tire dúvidas sobre modalidades, pagamentos ou suporte no dia da prova.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-900 transition-colors hover:bg-white/90"
              href={`mailto:${supportEmail}?subject=Ajuda%20com%20inscricao`}
            >
              <Mail className="h-4 w-4" />
              Enviar e-mail
            </a>
            {whatsappLink && (
              <a
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                href={whatsappLink}
                rel="noreferrer"
                target="_blank"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 text-center text-xs text-slate-400">
          Powered by Okê Sports
        </footer>
      </div> {/* end max-w-7xl container */}
    </div>
  );
}
