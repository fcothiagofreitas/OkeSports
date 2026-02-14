import { notFound } from 'next/navigation';
import { Calendar, MapPin, Mail, MessageCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-[#e9e9e9]">
      <div className="border-b border-[#e5e7eb] bg-white">
        <div className="flex items-center justify-between px-4 py-3 sm:px-8">
          <p className="text-sm font-bold tracking-[0.08em] text-[#0f172a]">🏃 Okê Sports</p>
          <div className="hidden items-center gap-6 text-xs text-[#6b7280] md:flex">
            <span>{event.location ? `${event.location.city}, ${event.location.state}` : 'Evento esportivo'}</span>
            <span>{eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span>
          </div>
        </div>
      </div>

      <div className="w-full px-3 py-4 sm:px-6 sm:py-6">
        <section className="overflow-hidden rounded-[20px] bg-[#05060b] text-white">
          <div className="relative">
            <div className="absolute inset-0">
              <img alt={event.name} className="h-full w-full object-cover opacity-35" src={heroImage} />
              <div className="absolute inset-0 bg-gradient-to-b from-[#05060b]/70 via-[#05060b] to-[#f8f8f8]/70" />
            </div>

            <div className="relative p-5 sm:p-8 lg:p-10">
              <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs">
                <span className="rounded-full border border-white/25 px-3 py-1.5 uppercase tracking-[0.12em]">
                  {eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                {event.location && (
                  <span className="rounded-full border border-white/25 px-3 py-1.5 uppercase tracking-[0.12em]">
                    {event.location.city}, {event.location.state}
                  </span>
                )}
                <span className="rounded-full border border-white/25 px-3 py-1.5 uppercase tracking-[0.12em]">
                  Faltam {daysToEvent} dias
                </span>
                <span
                  className={`rounded-full px-3 py-1.5 uppercase tracking-[0.12em] ${
                    event.isRegistrationOpen ? 'bg-emerald-500 text-white' : 'bg-white/15 text-white'
                  }`}
                >
                  {event.isRegistrationOpen ? 'Inscrições abertas' : 'Inscrições encerradas'}
                </span>
              </div>

              <h1 className="mt-6 text-4xl leading-tight sm:text-6xl">{event.name}</h1>
              <p className="mt-3 max-w-[640px] text-sm leading-7 text-white/80 sm:text-base">{aboutDescription}</p>

              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {event.modalities.length > 0 ? (
                  event.modalities.map((modality) => {
                    const price = Number(modality.price);
                    const pricing = buildPrice(price, event.activeBatch);

                    return (
                    <article key={modality.id} className="rounded-3xl border border-black/10 bg-white p-4 text-[#0f172a] shadow-sm">
                        <p className="text-xl font-semibold">{modality.name}</p>
                        {modality.description && <p className="mt-1 text-sm text-[#6b7280]">{modality.description}</p>}

                        <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[#9ca3af]">Valor</p>
                        {pricing.discount > 0 && (
                          <p className="text-xs text-[#9ca3af] line-through">{priceFormatter.format(pricing.base)}</p>
                        )}
                        <p className="text-4xl font-semibold">{price === 0 ? 'Gratuito' : priceFormatter.format(pricing.final)}</p>

                        <RegistrationButton
                          eventSlug={event.slug}
                          modalityId={modality.id}
                          modalityName={modality.name}
                          isDisabled={!event.isRegistrationOpen || modality.isSoldOut}
                          disabledReason={
                            modality.isSoldOut ? 'Esgotado' : !event.isRegistrationOpen ? 'Inscrições Encerradas' : undefined
                          }
                          labelOverride="Inscreva-se"
                          className="mt-4 h-11 rounded-full"
                        />
                      </article>
                    );
                  })
                ) : (
                  <article className="md:col-span-2 lg:col-span-3 xl:col-span-4 rounded-2xl border border-dashed border-white/25 p-8 text-sm text-white/70">
                    Modalidades em breve.
                  </article>
                )}
              </div>
            </div>
          </div>
        </section>

        <main className="space-y-6 py-6">
          <section className="grid gap-4 md:grid-cols-3">
            {sellingPoints.map((point, index) => {
              const iconKey = typeof point.icon === 'string' ? (point.icon as LandingIconKey) : undefined;
              const fallbackIconKey = defaultSellingPoints[index % defaultSellingPoints.length].icon;
              return (
                <article key={`${point.title}-${index}`} className="rounded-3xl border border-[#e5e7eb] bg-white p-5">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-pink-50">
                    <LandingIcon className="h-5 w-5 text-pink-500" iconKey={iconKey || fallbackIconKey} />
                  </div>
                  <p className="text-2xl font-semibold leading-tight">{point.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#6b7280]">{point.description}</p>
                </article>
              );
            })}
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-3xl border border-[#e5e7eb] bg-white p-5 sm:p-6">
              <h2 className="text-3xl font-semibold">Sobre o evento</h2>
              <p className="mt-4 text-sm leading-7 text-[#4b5563]">{aboutDescription}</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#9ca3af]">Cronograma</p>
                  <ul className="mt-3 space-y-3 text-sm text-[#374151]">
                    <li>
                      <span className="font-semibold text-[#111827]">Inscrições</span>
                      <p>
                        {regStart.toLocaleDateString('pt-BR')} até {regEnd.toLocaleDateString('pt-BR')}
                      </p>
                    </li>
                    <li>
                      <span className="font-semibold text-[#111827]">Largada</span>
                      <p>
                        {eventDate.toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                        })}
                      </p>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#9ca3af]">Inclui</p>
                  <ul className="mt-3 space-y-2 text-sm text-[#374151]">
                    {includes.map((item, index) => (
                      <li key={`${item}-${index}`}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#e5e7eb] bg-white p-5 sm:p-6">
              <h2 className="text-3xl font-semibold">Localização</h2>
              <p className="mt-2 text-sm text-[#6b7280]">Garanta tempo para chegar com tranquilidade e aproveite o ambiente pré-prova.</p>

              <div className="mt-4 rounded-2xl bg-[#f3f4f6] p-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#111827]">
                  <MapPin className="h-4 w-4" />
                  {event.location ? event.location.city : 'Local a definir'}
                </p>
                <p className="text-xs text-[#6b7280]">{event.location ? event.location.state : ''}</p>
              </div>

              <div className="mt-4 rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-4">
                <p className="text-sm font-semibold text-[#111827]">Dicas rápidas</p>
                <ul className="mt-2 space-y-2 text-sm text-[#4b5563]">
                  {tips.map((tip, index) => (
                    <li key={`${tip}-${index}`}>• {tip}</li>
                  ))}
                </ul>
              </div>
            </article>
          </section>

          <section className="rounded-3xl bg-white p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-[#9ca3af]">FAQ</p>
            <h2 className="mt-2 text-4xl font-semibold">Dúvidas frequentes</h2>
            <div className="mt-5 space-y-3">
              {faq.map((item, index) => (
                <details key={`${item.question}-${index}`} className="rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-4" open={index === 0}>
                  <summary className="cursor-pointer text-lg font-semibold text-[#111827]">{item.question}</summary>
                  <p className="mt-2 text-sm text-[#6b7280]">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-dashed border-[#d1d5db] bg-white px-6 py-10 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Precisa de ajuda?</p>
            <h3 className="mt-2 text-4xl font-semibold">Fale com nossa equipe</h3>
            <p className="mt-2 text-sm text-[#6b7280]">Tire dúvidas sobre modalidades, pagamentos ou suporte no dia da prova.</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <a
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0b0d10] px-5 text-sm font-semibold text-white"
                href={`mailto:${supportEmail}?subject=Ajuda%20com%20inscricao`}
              >
                <Mail className="h-4 w-4" />
                Enviar e-mail
              </a>
              {whatsappLink && (
                <a
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[#0b0d10] px-5 text-sm font-semibold text-[#0b0d10]"
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
        </main>

        <footer className="border-t border-[#e5e7eb] px-2 py-5 text-center text-sm text-[#6b7280]">
          Powered by Okê Sports • Faça sua prova acontecer.
        </footer>
      </div>
    </div>
  );
}
