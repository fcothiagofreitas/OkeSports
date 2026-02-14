import { notFound } from 'next/navigation';
import { ArrowRight, Calendar, Mail, MapPin, MessageCircle, Minus, Plus } from 'lucide-react';
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
  const daysToClose = Math.max(0, Math.ceil((regEnd.getTime() - now.getTime()) / dayMs));

  const priceFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const hasModalities = event.modalities.length > 0;
  const cheapestModality = hasModalities
    ? event.modalities.reduce((prev, curr) =>
        Number(curr.price) < Number(prev.price) ? curr : prev,
      event.modalities[0])
    : null;

  const defaultSellingPoints = [
    {
      icon: 'trophy' as LandingIconKey,
      title: 'Execucao de prova sem atrito',
      description: 'Fluxo de evento com sinalizacao, suporte e comunicacao em cada etapa.',
    },
    {
      icon: 'shield' as LandingIconKey,
      title: 'Performance para organizador',
      description: 'Landing white-label pronta para converter e escalar diferentes corridas.',
    },
    {
      icon: 'heart' as LandingIconKey,
      title: 'Experiencia para atleta',
      description: 'Inscricao simples, informacoes claras e jornada completa ate a largada.',
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
    landingAbout.description ||
    event.shortDescription ||
    event.description ||
    'Uma estrutura premium para divulgar corridas e aumentar conversao de inscricoes.';

  const defaultFaq: LandingFaq[] = [
    {
      question: 'Quando as inscricoes encerram?',
      answer: `As inscricoes encerram em ${regEnd.toLocaleDateString('pt-BR')}.`,
    },
    {
      question: 'Posso alterar dados da minha inscricao?',
      answer: 'As alteracoes seguem as regras do organizador e do prazo do evento.',
    },
    {
      question: 'Quais formas de pagamento estao disponiveis?',
      answer: 'As opcoes aparecem no checkout de inscricao do evento.',
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

  const caseImage =
    event.bannerUrl ||
    event.coverUrl ||
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80';

  const supportEmail = event.supportEmail || 'contato@okesports.com';
  const supportWhatsapp = event.supportWhatsapp || undefined;
  const whatsappLink = supportWhatsapp ? `https://wa.me/${supportWhatsapp.replace(/\D/g, '')}` : null;

  return (
    <div className="min-h-screen bg-[#f1f1f1] p-3 sm:p-6">
      <div className="mx-auto max-w-[1400px] rounded-[28px] bg-[#fafafa] p-3 sm:p-5 lg:p-6">
        <section className="rounded-[22px] bg-white p-4 sm:p-6 lg:p-8">
          <header className="flex items-center justify-between gap-4">
            <p className="text-sm font-bold tracking-[0.08em]">OKE SPORTS</p>
            <nav className="hidden items-center gap-7 text-sm text-[#5f6368] md:flex">
              <a href="#sobre">Sobre</a>
              <a href="#modalidades">Modalidades</a>
              <a href="#faq">FAQ</a>
              <a href="#contato">Contato</a>
            </nav>
            <div className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">Evento Publico</div>
          </header>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="space-y-5">
              <h1 className="max-w-[720px] text-4xl leading-[1.02] text-[#010205] sm:text-6xl">
                Corra na frente com uma experiencia premium de inscricao
              </h1>
              <p className="max-w-[600px] text-sm leading-7 text-[#878c91] sm:text-base">{aboutDescription}</p>

              <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#d6d8da] px-3 py-1.5">
                  <Calendar className="h-4 w-4" />
                  {eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#d6d8da] px-3 py-1.5">
                  <MapPin className="h-4 w-4" />
                  {event.location ? `${event.location.city}, ${event.location.state}` : 'Local em definicao'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {cheapestModality && (
                  <RegistrationButton
                    eventSlug={event.slug}
                    modalityId={cheapestModality.id}
                    modalityName={cheapestModality.name}
                    isDisabled={!event.isRegistrationOpen || cheapestModality.isSoldOut}
                    disabledReason={
                      cheapestModality.isSoldOut ? 'Esgotado' : !event.isRegistrationOpen ? 'Inscricoes Encerradas' : undefined
                    }
                    labelOverride={event.isRegistrationOpen ? 'Garantir vaga' : undefined}
                    className="h-12 rounded-full px-7"
                  />
                )}
                <a className="text-sm font-semibold underline" href="#modalidades">
                  Ver modalidades
                </a>
              </div>

              <div className="grid max-w-[420px] grid-cols-3 overflow-hidden rounded-2xl border border-[#e6e7e9]">
                <div className="p-3">
                  <p className="text-[11px] uppercase tracking-[0.09em] text-[#878c91]">Inscritos</p>
                  <p className="mt-1 text-2xl font-bold">{event.totalRegistrations}+</p>
                </div>
                <div className="border-x border-[#e6e7e9] p-3">
                  <p className="text-[11px] uppercase tracking-[0.09em] text-[#878c91]">Largada</p>
                  <p className="mt-1 text-2xl font-bold">{daysToEvent}d</p>
                </div>
                <div className="p-3">
                  <p className="text-[11px] uppercase tracking-[0.09em] text-[#878c91]">Prazo</p>
                  <p className="mt-1 text-2xl font-bold">{daysToClose}d</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_260px]">
              <div className="overflow-hidden rounded-[20px] bg-[#010205]">
                <img alt={event.name} className="h-full min-h-[280px] w-full object-cover opacity-70" src={heroImage} />
              </div>
              <div className="grid gap-4">
                <div className="rounded-[20px] bg-[#efefef] p-5">
                  <p className="text-5xl font-bold text-[#010205]">{event.activeBatch ? '230+' : '100+'}</p>
                  <p className="mt-3 text-sm text-[#5c5d5f]">atletas e equipes ja confiaram nas experiencias desta plataforma.</p>
                </div>
                <div className="rounded-[20px] bg-[#010205] p-5 text-white">
                  <p className="text-sm text-white/75">A partir de</p>
                  <p className="mt-1 text-3xl font-semibold">
                    {!cheapestModality
                      ? 'Em breve'
                      : Number(cheapestModality.price) === 0
                        ? 'Gratuito'
                        : priceFormatter.format(Number(cheapestModality.price))}
                  </p>
                  <p className="mt-3 text-xs text-white/70">Modalidade com melhor custo para entrada.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-4 text-xs text-[#70767d] sm:text-sm">
            <span className="font-semibold text-[#010205]">Confiado por organizadores:</span>
            <span>Track&Run</span>
            <span>City Runners</span>
            <span>Summit Sports</span>
            <span>ProEvents</span>
          </div>
        </section>

        <section className="mt-6 rounded-[22px] bg-white p-4 sm:p-6 lg:p-8" id="sobre">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <h2 className="text-3xl leading-tight sm:text-5xl">Entregue uma prova impecavel com ideias fora do padrao</h2>
            <p className="text-sm leading-7 text-[#878c91] sm:text-base">
              {event.description ||
                'Da pagina de venda ao checkout da inscricao, sua corrida ganha um fluxo completo para escalar conversao e melhorar experiencia do atleta.'}
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[420px_1fr]">
            <article className="rounded-[20px] bg-[#02060a] p-6 text-white">
              <p className="text-5xl font-bold">920+</p>
              <p className="mt-2 text-sm text-white/70">inscricoes processadas em experiencias similares.</p>
              <div className="mt-7 flex items-center gap-2">
                <div className="h-10 w-10 rounded-full border border-white/25 bg-white/10" />
                <div className="h-10 w-10 rounded-full border border-white/25 bg-white/10" />
                <div className="h-10 w-10 rounded-full border border-white/25 bg-white/10" />
                <div className="h-10 w-10 rounded-full border border-white/25 bg-white/10" />
                <span className="text-2xl">+</span>
              </div>
            </article>

            <article className="relative overflow-hidden rounded-[20px] bg-[#dedede] p-6">
              <img alt="Fluxo da prova" className="absolute inset-0 h-full w-full object-cover opacity-30" src={caseImage} />
              <div className="relative flex h-full min-h-[220px] items-end justify-between">
                <p className="text-3xl tracking-[0.2em] text-white">FLUXO DA PROVA</p>
                <div className="grid h-14 w-14 place-content-center rounded-full bg-lime-400 text-black">
                  <ArrowRight className="h-6 w-6" />
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="mt-6 rounded-[22px] bg-[#010205] p-4 text-white sm:p-6 lg:p-8" id="modalidades">
          <h3 className="mx-auto max-w-[760px] text-center text-3xl leading-tight sm:text-4xl">
            Corridas reais, resultados reais para atletas e organizadores
          </h3>

          <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs sm:text-sm">
            <span className="rounded-full border border-white/20 px-4 py-1.5">Street Run</span>
            <span className="rounded-full bg-lime-300 px-4 py-1.5 text-black">Mountain Trail</span>
            <span className="rounded-full border border-white/20 px-4 py-1.5">Night Race</span>
            <span className="rounded-full border border-white/20 px-4 py-1.5">Beach Run</span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {hasModalities ? (
              event.modalities.slice(0, 3).map((modality) => {
                const price = Number(modality.price);
                const pricing = buildPrice(price, event.activeBatch);
                return (
                  <article key={modality.id} className="rounded-[18px] bg-white/8 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.12em] text-white/65">Modalidade</p>
                    <h4 className="mt-1 text-xl font-semibold">{modality.name}</h4>
                    <p className="mt-2 text-sm text-white/70">{modality.description || 'Categoria oficial do evento.'}</p>
                    <div className="mt-4 rounded-xl bg-white p-3 text-black">
                      {pricing.discount > 0 && (
                        <p className="text-xs text-gray-500 line-through">{priceFormatter.format(pricing.base)}</p>
                      )}
                      <p className="text-2xl font-semibold">
                        {price === 0 ? 'Gratuito' : priceFormatter.format(pricing.final)}
                      </p>
                    </div>
                    <p className="mt-3 text-xs text-white/70">
                      {modality.maxSlots
                        ? `${Math.max(0, modality.availableSlots || 0)} de ${modality.maxSlots} vagas`
                        : 'Vagas sem limite'}
                    </p>
                    <RegistrationButton
                      eventSlug={event.slug}
                      modalityId={modality.id}
                      modalityName={modality.name}
                      isDisabled={!event.isRegistrationOpen || modality.isSoldOut}
                      disabledReason={
                        modality.isSoldOut ? 'Esgotado' : !event.isRegistrationOpen ? 'Inscricoes Encerradas' : undefined
                      }
                      labelOverride="Inscrever"
                      className="mt-3 h-10 rounded-xl"
                    />
                  </article>
                );
              })
            ) : (
              <article className="col-span-full rounded-[18px] border border-dashed border-white/30 p-8 text-center text-white/70">
                Modalidades em configuracao para este evento.
              </article>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[22px] bg-white p-4 sm:p-6 lg:p-8">
          <p className="text-lg leading-8 text-[#010205] sm:text-2xl">
            "A estrutura desta landing elevou a taxa de inscricao e melhorou a percepcao do evento pelos atletas."
          </p>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm font-semibold text-[#4b4f54]">Organizacao Parceira</p>
            <div className="flex items-center gap-2 text-sm text-[#4b4f54]">
              <button className="rounded-full border border-[#d8d9db] p-1.5" type="button">
                <Minus className="h-4 w-4" />
              </button>
              <span>1/3</span>
              <button className="rounded-full bg-black p-1.5 text-white" type="button">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 rounded-[22px] bg-white p-4 sm:p-6 lg:grid-cols-[340px_1fr] lg:p-8" id="faq">
          <div>
            <p className="text-sm text-[#878c91]">Tudo que atleta e organizador precisam saber</p>
            <h3 className="mt-2 text-3xl leading-tight">FAQ do evento</h3>
            <div className="mt-5 space-y-2 text-sm">
              <button className="rounded-full border border-black px-4 py-2" type="button">
                Inscricoes
              </button>
              <button className="ml-2 rounded-full border border-[#d8d9db] px-4 py-2" type="button">
                Contato
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {faq.map((item, index) => (
              <details key={`${item.question}-${index}`} className="border-b border-[#e4e5e7] pb-3" open={index === 0}>
                <summary className="cursor-pointer list-none text-sm font-semibold text-[#010205] sm:text-base">
                  {item.question}
                </summary>
                <p className="mt-2 text-sm text-[#878c91]">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[22px] bg-white p-4 sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <h3 className="text-3xl leading-tight sm:text-5xl">Conteudo e estrutura para escalar corridas</h3>
            <div className="space-y-4 text-[#878c91]">
              <p>
                Landing personalizada com blocos editaveis para cada organizador, mantendo padrao visual e alto desempenho de conversao.
              </p>
              <button className="rounded-full border border-black px-5 py-2 text-sm font-semibold text-black" type="button">
                Ver mais
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {sellingPoints.slice(0, 3).map((point, index) => {
              const iconKey = typeof point.icon === 'string' ? (point.icon as LandingIconKey) : undefined;
              const fallbackIconKey = defaultSellingPoints[index % defaultSellingPoints.length].icon;
              return (
                <article className="rounded-[16px] border border-[#ebeced] bg-[#fcfcfc] p-5" key={`${point.title}-${index}`}>
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-lime-100">
                    <LandingIcon className="h-4 w-4 text-lime-700" iconKey={iconKey || fallbackIconKey} />
                  </div>
                  <h4 className="text-lg font-semibold text-[#010205]">{point.title}</h4>
                  <p className="mt-2 text-sm text-[#878c91]">{point.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-[22px] bg-[#020609] p-6 text-white sm:p-8" id="contato">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-4xl leading-tight sm:text-6xl">Pronto para abrir as inscricoes?</h3>
            <div className="flex flex-wrap gap-2">
              <a
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black"
                href={`mailto:${supportEmail}?subject=Ajuda%20com%20inscricao`}
              >
                <Mail className="h-4 w-4" />
                Contato
              </a>
              {whatsappLink && (
                <a
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/35 px-5 text-sm font-semibold"
                  href={whatsappLink}
                  rel="noreferrer"
                  target="_blank"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>

        <footer className="mt-6 rounded-[22px] bg-white p-4 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
            <div>
              <p className="text-xl font-bold">OKE SPORTS</p>
              <p className="mt-3 text-sm text-[#878c91]">
                White-label para corridas com visual premium, SEO e fluxo orientado a inscricao.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#010205]">Navegacao</p>
              <ul className="mt-3 space-y-2 text-sm text-[#878c91]">
                <li>Sobre</li>
                <li>Modalidades</li>
                <li>FAQ</li>
                <li>Contato</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#010205]">Politicas</p>
              <ul className="mt-3 space-y-2 text-sm text-[#878c91]">
                <li>Privacidade</li>
                <li>Termos</li>
                <li>Suporte</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#010205]">Datas do Evento</p>
              <ul className="mt-3 space-y-2 text-sm text-[#878c91]">
                <li>{regStart.toLocaleDateString('pt-BR')}</li>
                <li>{regEnd.toLocaleDateString('pt-BR')}</li>
                <li>{eventDate.toLocaleDateString('pt-BR')}</li>
              </ul>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
