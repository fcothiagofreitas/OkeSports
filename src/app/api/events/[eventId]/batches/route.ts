import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import prisma from '@/lib/db';
import { createBatchSchema } from '@/lib/validations/modality';
import { ZodError } from 'zod';

// ============================================
// POST /api/events/[eventId]/batches
// ============================================
// Cria um novo lote no evento

async function createBatch(
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
        { error: 'Você não tem permissão para adicionar lotes a este evento' },
        { status: 403 }
      );
    }

    // Validar dados
    const validatedData = createBatchSchema.parse({ ...body, eventId });

    // Converter datas se fornecidas
    const startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
    const endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;

    // Criar lote
    const batch = await prisma.batch.create({
      data: {
        eventId,
        name: validatedData.name,
        type: validatedData.type,
        startDate,
        endDate,
        maxSales: validatedData.maxSales,
        discountType: validatedData.discountType,
        discountValue: validatedData.discountValue,
        active: validatedData.active,
      },
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create batch error:', error);
    return NextResponse.json({ error: 'Erro ao criar lote' }, { status: 500 });
  }
}

// ============================================
// GET /api/events/[eventId]/batches
// ============================================
// Lista lotes do evento

async function listBatches(
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

    // Buscar lotes
    const batches = await prisma.batch.findMany({
      where: { eventId },
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json({ batches });
  } catch (error) {
    console.error('List batches error:', error);
    return NextResponse.json({ error: 'Erro ao listar lotes' }, { status: 500 });
  }
}

export const POST = withAuth(createBatch);
export const GET = withAuth(listBatches);
