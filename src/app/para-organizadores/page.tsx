import Link from 'next/link';
import { Metadata } from 'next';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CreditCard,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Para Organizadores | Publique seu evento na OkeSports',
  description:
    'Aprenda como criar um evento de corrida na OkeSports: cadastro, configuração de modalidades, lotes, pagamentos e publicação.',
  openGraph: {
    title: 'Para Organizadores | Publique seu evento na OkeSports',
    description:
      'Guia prático para criar e publicar seu evento esportivo na OkeSports com inscrição online e checkout integrado.',
  },
};

const steps = [
  {
    title: '1. Crie sua conta de organizador',
    description:
      'Acesse cadastro, valide seus dados e complete o perfil da organização em poucos minutos.',
  },
  {
    title: '2. Cadastre os dados do evento',
    description: 'Defina nome, data, local, descrição e artes da página oficial do evento.',
  },
  {
    title: '3. Configure modalidades e lotes',
    description: 'Monte percursos, preços, limites e virada de lotes para controlar vendas.',
  },
  {
    title: '4. Ative pagamentos e publique',
    description:
      'Conecte o pagamento, revise a página e publique para começar a receber inscrições.',
  },
];

const faqs = [
  {
    q: 'Quanto tempo leva para publicar um evento?',
    a: 'Com os dados prontos, em geral menos de 30 minutos.',
  },
  {
    q: 'Posso editar o evento depois de publicar?',
    a: 'Sim. Você pode atualizar descrições, lotes e configurações conforme a necessidade.',
  },
  {
    q: 'A OkeSports gera link público do evento?',
    a: 'Sim. Cada evento recebe página própria para divulgação e inscrições.',
  },
];

export default function ParaOrganizadoresPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff_0%,#fff8f2_40%,#f5fbff_100%)]">
      <section className="mx-auto w-full max-w-6xl px-5 pb-14 pt-14 md:px-8">
        <div className="max-w-3xl space-y-5">
          <p className="inline-flex items-center rounded-full bg-[hsl(var(--orange))]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--gray-800))]">
            Guia para Organizadores
          </p>
          <h1 className="text-4xl leading-tight text-[hsl(var(--dark))] md:text-6xl">
            Crie e publique seu evento esportivo na OkeSports.
          </h1>
          <p className="text-base text-[hsl(var(--gray-700))] md:text-lg">
            Centralize inscrições, modalidades, lotes e pagamentos em um único painel. Sem planilhas
            manuais, sem checkout quebrado e com página oficial pronta para divulgar.
          </p>
          <Button asChild size="lg" variant="pink">
            <Link href="/cadastro">
              Começar agora
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-5 pb-12 md:grid-cols-4 md:px-8">
        <Card className="bg-white/90">
          <CardContent className="flex items-center gap-3 py-5 text-sm">
            <Timer className="h-5 w-5 text-[hsl(var(--orange))]" />
            Publicação rápida
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardContent className="flex items-center gap-3 py-5 text-sm">
            <CalendarClock className="h-5 w-5 text-[hsl(var(--orange))]" />
            Gestão de lotes
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardContent className="flex items-center gap-3 py-5 text-sm">
            <CreditCard className="h-5 w-5 text-[hsl(var(--orange))]" />
            Checkout integrado
          </CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardContent className="flex items-center gap-3 py-5 text-sm">
            <ShieldCheck className="h-5 w-5 text-[hsl(var(--orange))]" />
            Operação segura
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-12 md:px-8">
        <h2 className="mb-4 text-3xl text-[hsl(var(--dark))]">Como criar seu evento</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <Card key={step.title} className="border-[hsl(var(--gray-200))] bg-white/95">
              <CardHeader>
                <CardTitle className="text-xl">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[hsl(var(--gray-700))]">
                {step.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-12 md:px-8">
        <h2 className="mb-4 text-3xl text-[hsl(var(--dark))]">Por que usar a OkeSports</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-white/95">
            <CardHeader>
              <CardTitle className="text-xl">Menos trabalho manual</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[hsl(var(--gray-700))]">
              Automatize inscrições, pagamento e confirmação de atletas.
            </CardContent>
          </Card>
          <Card className="bg-white/95">
            <CardHeader>
              <CardTitle className="text-xl">Mais conversão</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[hsl(var(--gray-700))]">
              Página pública otimizada para quem quer se inscrever rápido.
            </CardContent>
          </Card>
          <Card className="bg-white/95">
            <CardHeader>
              <CardTitle className="text-xl">Controle total</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[hsl(var(--gray-700))]">
              Gerencie modalidades, lotes e inscrições sem depender de terceiros.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 md:px-8">
        <h2 className="mb-4 text-3xl text-[hsl(var(--dark))]">FAQ</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <Card key={faq.q} className="bg-white/95">
              <CardContent className="py-5">
                <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-[hsl(var(--dark))]">
                  <BadgeCheck className="h-4 w-4 text-[hsl(var(--green))]" />
                  {faq.q}
                </p>
                <p className="text-sm text-[hsl(var(--gray-700))]">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-[hsl(var(--gray-200))] bg-white p-6 text-center">
          <h3 className="text-2xl text-[hsl(var(--dark))]">
            Pronto para publicar sua próxima corrida?
          </h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-[hsl(var(--gray-700))]">
            Crie sua conta e deixe a estrutura da inscrição pronta hoje.
          </p>
          <Button asChild size="lg" variant="pink" className="mt-4">
            <Link href="/cadastro">
              Criar meu evento
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
