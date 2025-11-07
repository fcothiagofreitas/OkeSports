import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import prisma from '@/lib/db';
import { updateEventSchema } from '@/lib/validations/event';
import { ZodError } from 'zod';

// ============================================
// GET /api/events/[id]
// ============================================
// Busca um evento específico
// Requer autenticação

async function getEvent(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId: id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        location: true,
        modalities: {
          orderBy: { price: 'asc' },
        },
        batches: {
          orderBy: { startDate: 'asc' },
        },
        coupons: {
          where: {
            isActive: true,
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
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    // Verificar se o evento pertence ao organizador
    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar este evento' },
        { status: 403 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json({ error: 'Erro ao buscar evento' }, { status: 500 });
  }
}

// ============================================
// PATCH /api/events/[id]
// ============================================
// Atualiza um evento
// Requer autenticação e propriedade do evento

async function updateEvent(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId: id } = await params;
    const body = await request.json();

    // Validar dados
    const validatedData = updateEventSchema.parse(body);

    // Verificar se evento existe e pertence ao usuário
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: { organizerId: true, status: true },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    if (existingEvent.organizerId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para editar este evento' },
        { status: 403 }
      );
    }

    // Converter datas se fornecidas
    const updateData: any = { ...validatedData };

    if (validatedData.eventDate) {
      updateData.eventDate = new Date(validatedData.eventDate);
    }
    if (validatedData.registrationStart) {
      updateData.registrationStart = new Date(validatedData.registrationStart);
    }
    if (validatedData.registrationEnd) {
      updateData.registrationEnd = new Date(validatedData.registrationEnd);
    }

    // Se está publicando pela primeira vez, definir publishedAt
    if (validatedData.status === 'PUBLISHED' && existingEvent.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date();
    }

    // Atualizar localização se fornecida
    if (validatedData.location) {
      updateData.location = {
        upsert: {
          create: validatedData.location,
          update: validatedData.location,
        },
      };
    }

    // Atualizar evento
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        location: true,
        _count: {
          select: {
            modalities: true,
            registrations: true,
          },
        },
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update event error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar evento' }, { status: 500 });
  }
}

// ============================================
// DELETE /api/events/[id]
// ============================================
// Deleta um evento
// Requer autenticação e propriedade do evento
// Só permite deletar se não houver inscrições confirmadas

async function deleteEvent(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId: id } = await params;

    // Verificar se evento existe e pertence ao usuário
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        organizerId: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para deletar este evento' },
        { status: 403 }
      );
    }

    // Verificar se há inscrições
    if (event._count.registrations > 0) {
      return NextResponse.json(
        {
          error:
            'Não é possível deletar evento com inscrições. Cancele o evento ao invés de deletar.',
        },
        { status: 400 }
      );
    }

    // Deletar evento (cascade vai deletar relacionamentos)
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Evento deletado com sucesso' });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json({ error: 'Erro ao deletar evento' }, { status: 500 });
  }
}

export const GET = withAuth(getEvent);
export const PATCH = withAuth(updateEvent);
export const DELETE = withAuth(deleteEvent);
