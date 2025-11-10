import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// ============================================
// GET /api/events/by-slug/[slug]
// ============================================
// Busca evento público por slug
// NÃO requer autenticação (público)
// Retorna APENAS eventos com status PUBLISHED

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Buscar evento público
    const event = await prisma.event.findUnique({
      where: {
        slug,
        status: 'PUBLISHED', // Apenas eventos publicados
      },
      include: {
        location: true,
        modalities: {
          where: {
            active: true, // Apenas modalidades ativas
          },
          orderBy: {
            price: 'asc',
          },
          include: {
            _count: {
              select: {
                registrations: true,
              },
            },
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado ou não está publicado' },
        { status: 404 }
      );
    }

    // Calcular vagas disponíveis por modalidade
    const modalitiesWithAvailability = event.modalities.map((modality) => ({
      ...modality,
      availableSlots: modality.maxSlots
        ? modality.maxSlots - modality._count.registrations
        : null, // null = ilimitado
      isSoldOut: modality.maxSlots
        ? modality._count.registrations >= modality.maxSlots
        : false,
    }));

    // Verificar se evento está com inscrições abertas
    const now = new Date();
    const isRegistrationOpen =
      now >= event.registrationStart && now <= event.registrationEnd;

    // Resposta pública (não expor dados sensíveis)
    const publicEvent = {
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
      logoUrl: event.logoUrl,
      coverUrl: event.coverUrl,
      maxRegistrations: event.maxRegistrations,
      allowGroupReg: event.allowGroupReg,
      maxGroupSize: event.maxGroupSize,
      modalities: modalitiesWithAvailability,
      totalRegistrations: event._count.registrations,
      isRegistrationOpen,
      status: event.status,
    };

    return NextResponse.json(publicEvent);
  } catch (error) {
    console.error('Get public event error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar evento' },
      { status: 500 }
    );
  }
}
