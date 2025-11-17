'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Loader2 } from 'lucide-react';

function PendenteContent() {
  const searchParams = useSearchParams();
  const registrationId = searchParams.get('id');

  return (
    <div className="min-h-screen bg-[hsl(var(--gray-100))] flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
          <CardTitle className="text-3xl text-yellow-600">Pagamento Pendente</CardTitle>
          <CardDescription className="text-base">
            Estamos aguardando a confirmação do seu pagamento
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-900 mb-2">
              <strong>⏳ Aguardando confirmação</strong>
            </p>
            <p className="text-sm text-yellow-800">
              {registrationId && `Número da inscrição: #${registrationId}`}
            </p>
            <p className="text-sm text-yellow-800 mt-2">
              Se você pagou via PIX, a confirmação é geralmente instantânea.
              Para boleto, pode levar até 3 dias úteis.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>📧 Fique atento!</strong>
              <br />
              Assim que o pagamento for confirmado, você receberá um email com todos os detalhes.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/minha-conta" className="block">
              <Button className="w-full" size="lg">
                Acompanhar Status
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

export default function PendentePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[hsl(var(--gray-100))] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--accent-pink))]" />
      </div>
    }>
      <PendenteContent />
    </Suspense>
  );
}
