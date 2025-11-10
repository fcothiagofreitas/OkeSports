import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

export default function EventNotFound() {
  return (
    <div className="min-h-screen bg-[hsl(var(--gray-100))] flex items-center justify-center">
      <div className="text-center px-6">
        <Calendar className="h-24 w-24 text-[hsl(var(--gray-400))] mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-[hsl(var(--dark))] mb-4">
          Evento não encontrado
        </h1>
        <p className="text-lg text-[hsl(var(--gray-600))] mb-8">
          O evento que você está procurando não existe ou não está mais disponível.
        </p>
        <Link href="/">
          <Button>Voltar para Home</Button>
        </Link>
      </div>
    </div>
  );
}
