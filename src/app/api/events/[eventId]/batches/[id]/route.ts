import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import prisma from '@/lib/db';
import { updateBatchSchema } from '@/lib/validations/batch';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// ============================================
// GET /api/events/[eventId]/batches/[id]
// ============================================
// Busca um lote específico

async function getBatch(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId, id } = await params;

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

    // Buscar lote
    const batch = await prisma.batch.findFirst({
      where: {
        id,
        eventId,
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Get batch error:', error);
    return NextResponse.json({ error: 'Erro ao buscar lote' }, { status: 500 });
  }
}

// ============================================
// PATCH /api/events/[eventId]/batches/[id]
// ============================================
// Atualiza um lote

async function updateBatch(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId, id } = await params;
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
        { error: 'Você não tem permissão para editar este evento' },
        { status: 403 }
      );
    }

    // Verificar se lote existe
    const existingBatch = await prisma.batch.findFirst({
      where: {
        id,
        eventId,
      },
    });

    if (!existingBatch) {
      return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 });
    }

    // Validar dados
    const validatedData = updateBatchSchema.parse(body);

    // Preparar dados de atualização
    const updateData: Prisma.BatchUpdateInput = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.active !== undefined) updateData.active = validatedData.active;

    // Tratar datas
    if (validatedData.startDate !== undefined) {
      updateData.startDate = validatedData.startDate === null ? null : new Date(validatedData.startDate as any);
    }
    if (validatedData.endDate !== undefined) {
      updateData.endDate = validatedData.endDate === null ? null : new Date(validatedData.endDate as any);
    }

    // Tratar volume
    if (validatedData.maxSales !== undefined) {
      updateData.maxSales = validatedData.maxSales;
    }

    // Tratar desconto
    if (validatedData.discountType !== undefined) {
      updateData.discountType = validatedData.discountType;
    }
    if (validatedData.discountValue !== undefined) {
      updateData.discountValue = validatedData.discountValue === null 
        ? null 
        : new Prisma.Decimal(validatedData.discountValue);
    }

    // Atualizar lote
    const batch = await prisma.batch.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(batch);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update batch error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar lote' }, { status: 500 });
  }
}

// ============================================
// DELETE /api/events/[eventId]/batches/[id]
// ============================================
// Deleta um lote

async function deleteBatch(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId, id } = await params;

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
        { error: 'Você não tem permissão para deletar lotes deste evento' },
        { status: 403 }
      );
    }

    // Verificar se lote existe
    const batch = await prisma.batch.findFirst({
      where: {
        id,
        eventId,
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 });
    }

    // Deletar lote
    await prisma.batch.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Lote deletado com sucesso' });
  } catch (error) {
    console.error('Delete batch error:', error);
    return NextResponse.json({ error: 'Erro ao deletar lote' }, { status: 500 });
  }
}

export const GET = withAuth(getBatch);
export const PATCH = withAuth(updateBatch);
export const DELETE = withAuth(deleteBatch);
