'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Loader2 } from 'lucide-react';

function PendenteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Suporta tanto 'id' (compatibilidade) quanto 'ids' (múltiplas inscrições)
  const registrationIdsParam = searchParams.get('ids') || searchParams.get('id');
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!registrationIdsParam) {
      setError('IDs de inscrição não fornecidos');
      setLoading(false);
      return;
    }

    async function fetchRegistrations() {
      try {
        // Separar IDs (pode ser vírgula ou único)
        const ids = registrationIdsParam.split(',').filter(Boolean);
        
        // Buscar todas as inscrições
        const registrationPromises = ids.map((id) =>
          fetch(`/api/registrations/${id.trim()}`).then((res) => {
            if (res.ok) return res.json();
            return null;
          })
        );

        const results = await Promise.all(registrationPromises);
        const validRegistrations = results.filter((r) => r !== null);

        if (validRegistrations.length === 0) {
          setError('Nenhuma inscrição encontrada');
        } else {
          setRegistrations(validRegistrations);
        }
      } catch (error) {
        console.error('Erro ao buscar inscrições:', error);
        setError('Erro ao buscar inscrições');
      } finally {
        setLoading(false);
      }
    }

    fetchRegistrations();
  }, [registrationIdsParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--gray-100))] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--accent-pink))]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[hsl(var(--gray-100))] flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardContent className="pt-6">
            <p className="text-center text-red-600 mb-4">{error}</p>
            <Link href="/minha-conta" className="block">
              <Button className="w-full">Ir para Minha Conta</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAmount = registrations.reduce((sum, reg) => {
    return sum + (Number(reg.pricing?.total ?? reg.total) || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[hsl(var(--gray-100))] flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
          <CardTitle className="text-3xl text-yellow-600">Pagamento Pendente</CardTitle>
          <CardDescription className="text-base">
            {registrations.length > 1 
              ? `Estamos aguardando a confirmação do pagamento de ${registrations.length} inscrições`
              : 'Estamos aguardando a confirmação do seu pagamento'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {registrations.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-4">
              <p className="text-sm text-yellow-900 mb-2">
                <strong>⏳ Aguardando confirmação</strong>
              </p>
              
              {registrations.length > 1 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-yellow-900 mb-2">
                    {registrations.length} inscrições criadas:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                    {registrations.map((reg, index) => (
                      <li key={reg.id}>
                        #{reg.registrationNumber} - {reg.participant?.fullName || 'Participante'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">Evento:</span> {registrations[0]?.event?.name}
                </p>
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">Modalidade:</span> {registrations[0]?.modality?.name}
                </p>
                {registrations.length === 1 && (
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">Número da inscrição:</span> #{registrations[0].registrationNumber}
                  </p>
                )}
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">Total:</span>{' '}
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalAmount)}
                </p>
              </div>

              <p className="text-sm text-yellow-800 mt-3 pt-3 border-t border-yellow-300">
                Se você pagou via PIX, a confirmação costuma ser quase imediata.
                Para boleto, a compensação pode levar até 3 dias úteis.
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>📧 Fique atento!</strong>
              <br />
              Assim que o pagamento for confirmado, você receberá um email com todos os detalhes da sua inscrição.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/minha-conta" className="block">
              <Button className="w-full" size="lg">
                Acompanhar Status
              </Button>
            </Link>
            <Link href="/minha-conta" className="block">
              <Button variant="outline" className="w-full">
                Voltar para Minha Conta
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PendentePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[hsl(var(--gray-100))] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--accent-pink))]" />
        </div>
      }
    >
      <PendenteContent />
    </Suspense>
  );
}
