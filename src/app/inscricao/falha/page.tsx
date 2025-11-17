'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, Loader2 } from 'lucide-react';

function FalhaContent() {
  const searchParams = useSearchParams();
  const registrationId = searchParams.get('id');

  return (
    <div className="min-h-screen bg-[hsl(var(--gray-100))] flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-3xl text-red-600">Pagamento Não Aprovado</CardTitle>
          <CardDescription className="text-base">
            Não foi possível processar seu pagamento
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-900 mb-2">
              <strong>❌ O que aconteceu?</strong>
            </p>
            <p className="text-sm text-red-800">
              Seu pagamento foi recusado. Isso pode acontecer por diversos motivos:
            </p>
            <ul className="text-sm text-red-800 mt-2 ml-4 list-disc space-y-1">
              <li>Saldo ou limite insuficiente</li>
              <li>Dados do cartão incorretos</li>
              <li>Cartão vencido ou bloqueado</li>
              <li>Transação não autorizada pelo banco</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>💡 O que fazer?</strong>
              <br />
              Você pode tentar novamente com outro método de pagamento ou entrar em contato com seu banco.
            </p>
          </div>

          <div className="space-y-3">
            {registrationId && (
              <Link href={`/minha-conta`} className="block">
                <Button className="w-full" size="lg">
                  Tentar Novamente
                </Button>
              </Link>
            )}
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

export default function FalhaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[hsl(var(--gray-100))] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--accent-pink))]" />
      </div>
    }>
      <FalhaContent />
    </Suspense>
  );
}
