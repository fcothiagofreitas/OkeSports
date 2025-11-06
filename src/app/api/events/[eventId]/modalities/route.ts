import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import prisma from '@/lib/db';
import { createModalitySchema } from '@/lib/validations/modality';
import { ZodError } from 'zod';

// ============================================
// POST /api/events/[eventId]/modalities
// ============================================
// Cria uma nova modalidade no evento

async function createModality(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId } = await params;
    const body = await request.json();

    // Verificar se evento existe e pertence ao usuário
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para adicionar modalidades a este evento' },
        { status: 403 }
      );
    }

    // Validar dados
    const validatedData = createModalitySchema.parse({ ...body, eventId });

    // Criar modalidade
    const modality = await prisma.modality.create({
      data: {
        eventId,
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        maxSlots: validatedData.maxSlots,
        order: validatedData.order,
        active: validatedData.active,
      },
    });

    return NextResponse.json(modality, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create modality error:', error);
    return NextResponse.json({ error: 'Erro ao criar modalidade' }, { status: 500 });
  }
}

// ============================================
// GET /api/events/[eventId]/modalities
// ============================================
// Lista modalidades do evento

async function listModalities(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId } = await params;

    // Verificar se evento existe e pertence ao usuário
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar este evento' },
        { status: 403 }
      );
    }

    // Buscar modalidades
    const modalities = await prisma.modality.findMany({
      where: { eventId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return NextResponse.json({ modalities });
  } catch (error) {
    console.error('List modalities error:', error);
    return NextResponse.json({ error: 'Erro ao listar modalidades' }, { status: 500 });
  }
}

export const POST = withAuth(createModality);
export const GET = withAuth(listModalities);
