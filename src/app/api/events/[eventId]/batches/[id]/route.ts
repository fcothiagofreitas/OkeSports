import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import prisma from '@/lib/db';
import { updateBatchSchema } from '@/lib/validations/modality';
import { ZodError } from 'zod';

async function updateBatch(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId, id } = await params;
    const body = await request.json();

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: { event: { select: { organizerId: true } } },
    });

    if (!batch || batch.eventId !== eventId || batch.event.organizerId !== userId) {
      return NextResponse.json({ error: 'Lote não encontrado ou sem permissão' }, { status: 404 });
    }

    const validatedData = updateBatchSchema.parse(body);

    const updateData: any = { ...validatedData };
    if (validatedData.startDate) updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate) updateData.endDate = new Date(validatedData.endDate);

    const updated = await prisma.batch.update({ where: { id }, data: updateData });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }
    console.error('Update batch error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar lote' }, { status: 500 });
  }
}

async function deleteBatch(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId, id } = await params;

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: { event: { select: { organizerId: true } } },
    });

    if (!batch || batch.eventId !== eventId || batch.event.organizerId !== userId) {
      return NextResponse.json({ error: 'Lote não encontrado ou sem permissão' }, { status: 404 });
    }

    await prisma.batch.delete({ where: { id } });
    return NextResponse.json({ message: 'Lote deletado com sucesso' });
  } catch (error) {
    console.error('Delete batch error:', error);
    return NextResponse.json({ error: 'Erro ao deletar lote' }, { status: 500 });
  }
}

export const PATCH = withAuth(updateBatch);
export const DELETE = withAuth(deleteBatch);
