import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import prisma from '@/lib/db';
import { updateModalitySchema } from '@/lib/validations/modality';
import { ZodError } from 'zod';

// ============================================
// PATCH /api/events/[eventId]/modalities/[id]
// ============================================
// Atualiza uma modalidade

async function updateModality(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId, id } = await params;
    const body = await request.json();

    // Verificar se modalidade existe e pertence ao evento do usuário
    const modality = await prisma.modality.findUnique({
      where: { id },
      include: {
        event: {
          select: { organizerId: true },
        },
      },
    });

    if (!modality) {
      return NextResponse.json({ error: 'Modalidade não encontrada' }, { status: 404 });
    }

    if (modality.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Modalidade não pertence a este evento' },
        { status: 400 }
      );
    }

    if (modality.event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para editar esta modalidade' },
        { status: 403 }
      );
    }

    // Validar dados
    const validatedData = updateModalitySchema.parse(body);

    // Atualizar modalidade
    const updatedModality = await prisma.modality.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(updatedModality);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update modality error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar modalidade' }, { status: 500 });
  }
}

// ============================================
// DELETE /api/events/[eventId]/modalities/[id]
// ============================================
// Deleta uma modalidade

async function deleteModality(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId, id } = await params;

    // Verificar se modalidade existe e pertence ao evento do usuário
    const modality = await prisma.modality.findUnique({
      where: { id },
      include: {
        event: {
          select: { organizerId: true },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!modality) {
      return NextResponse.json({ error: 'Modalidade não encontrada' }, { status: 404 });
    }

    if (modality.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Modalidade não pertence a este evento' },
        { status: 400 }
      );
    }

    if (modality.event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para deletar esta modalidade' },
        { status: 403 }
      );
    }

    // Verificar se há inscrições
    if (modality._count.registrations > 0) {
      return NextResponse.json(
        {
          error:
            'Não é possível deletar modalidade com inscrições. Desative-a ao invés de deletar.',
        },
        { status: 400 }
      );
    }

    // Deletar modalidade
    await prisma.modality.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Modalidade deletada com sucesso' });
  } catch (error) {
    console.error('Delete modality error:', error);
    return NextResponse.json({ error: 'Erro ao deletar modalidade' }, { status: 500 });
  }
}

export const PATCH = withAuth(updateModality);
export const DELETE = withAuth(deleteModality);
