'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';

function SucessoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const registrationId = searchParams.get('id');
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!registrationId) {
      router.push('/');
      return;
    }

    // Buscar dados da inscrição
    async function fetchRegistration() {
      try {
        const response = await fetch(`/api/registrations/${registrationId}`);
        if (response.ok) {
          const data = await response.json();
          setRegistration(data);
        }
      } catch (error) {
        console.error('Erro ao buscar inscrição:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRegistration();
  }, [registrationId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--gray-100))] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--accent-pink))]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--gray-100))] flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl text-green-600">Pagamento Aprovado!</CardTitle>
          <CardDescription className="text-base">
            Sua inscrição foi confirmada com sucesso
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {registration && (
            <div className="p-4 bg-[hsl(var(--gray-50))] rounded-lg space-y-2">
              <h3 className="font-semibold text-[hsl(var(--dark))]">Detalhes da Inscrição</h3>
              <p className="text-sm text-[hsl(var(--gray-600))]">
                <span className="font-medium">Número:</span> #{registration.registrationNumber}
              </p>
              <p className="text-sm text-[hsl(var(--gray-600))]">
                <span className="font-medium">Evento:</span> {registration.event?.name}
              </p>
              <p className="text-sm text-[hsl(var(--gray-600))]">
                <span className="font-medium">Modalidade:</span> {registration.modality?.name}
              </p>
              <p className="text-sm text-[hsl(var(--gray-600))]">
                <span className="font-medium">Valor Pago:</span>{' '}
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(registration.total)}
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>📧 Confirmação enviada!</strong>
              <br />
              Enviamos um email de confirmação com todos os detalhes da sua inscrição.
              Verifique também a caixa de spam.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/minha-conta" className="block">
              <Button className="w-full" size="lg">
                Ver Minhas Inscrições
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                Voltar para Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SucessoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[hsl(var(--gray-100))] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--accent-pink))]" />
      </div>
    }>
      <SucessoContent />
    </Suspense>
  );
}
