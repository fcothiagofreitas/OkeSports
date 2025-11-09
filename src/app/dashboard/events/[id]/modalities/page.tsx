'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { ArrowLeft } from 'lucide-react';
import { ModalityManager } from '@/components/features/events/ModalityManager';
import { DashboardNav } from '@/components/layout/DashboardNav';

interface Event {
  id: string;
  name: string;
  status: string;
}

export default function EventModalitiesPage() {
  const params = useParams();
  const { accessToken } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvent();
  }, [params.id]);

  const fetchEvent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/events/${params.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setEvent(data);
      }
    } catch (error) {
      console.error('Erro ao buscar evento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--gray-100))] flex items-center justify-center">
        <p className="text-[hsl(var(--gray-600))]">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--gray-100))]">
      <DashboardNav />

      {/* Header */}
      <div className="bg-white border-b border-[hsl(var(--gray-200))]">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8">
          <Link
            href={`/dashboard/events/${params.id}/edit`}
            className="inline-flex items-center text-sm text-[hsl(var(--gray-600))] hover:text-[hsl(var(--dark))] mb-4 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para evento
          </Link>
          <h1 className="text-4xl font-bold text-[hsl(var(--dark))] font-sans">Modalidades</h1>
          <p className="text-lg text-[hsl(var(--gray-600))] mt-2">{event?.name}</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 lg:px-10 py-12">
        <Card className="p-6">
          <ModalityManager eventId={params.id as string} />
        </Card>
      </main>
    </div>
  );
}
