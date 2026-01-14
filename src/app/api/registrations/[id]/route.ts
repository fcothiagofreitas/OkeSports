import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import type { RegistrationStatus } from '@/types/checkout';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { z } from 'zod';

const updateRegistrationSchema = z.object({
  shirtSize: z.enum(['PP', 'P', 'M', 'G', 'GG', 'XG']).nullable().optional(),
});

// ============================================
// GET /api/registrations/[id]
// ============================================
// Consulta status de uma inscrição (público)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            name: true,
            eventDate: true,
          },
        },
        modality: {
          select: {
            name: true,
          },
        },
        participant: {
          select: {
            fullName: true,
            email: true,
          },
        },
        coupon: {
          select: {
            code: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Inscrição não encontrada' }, { status: 404 });
    }

    const response: RegistrationStatus = {
      id: registration.id,
      registrationNumber: registration.registrationNumber,
      status: registration.status,
      paymentStatus: registration.paymentStatus,

      event: {
        name: registration.event.name,
        eventDate: registration.event.eventDate.toISOString(),
      },

      modality: {
        name: registration.modality.name,
      },

      participant: {
        fullName: registration.participant.fullName,
        email: registration.participant.email,
      },

      pricing: {
        basePrice: Number(registration.basePrice),
        batchDiscount: 0,
        couponDiscount: Number(registration.discount),
        subtotal: Number(registration.subtotal),
        platformFee: Number(registration.platformFee),
        total: Number(registration.total),
        couponCode: registration.coupon?.code,
      },

      paymentMethod: registration.paymentMethod || undefined,
      paidAt: registration.paidAt?.toISOString(),

      createdAt: registration.createdAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get registration error:', error);
    return NextResponse.json({ error: 'Erro ao buscar inscrição' }, { status: 500 });
  }
}

// ============================================
// PATCH /api/registrations/[id]
// ============================================
// Atualiza dados de uma inscrição (requer autenticação do participante)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const token = extractBearerToken(authHeader);
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação inválido' },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validar dados
    const validatedData = updateRegistrationSchema.parse(body);

    // Buscar inscrição e verificar se pertence ao participante autenticado
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        participant: true,
      },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Inscrição não encontrada' }, { status: 404 });
    }

    // Verificar se o participante autenticado é o dono da inscrição
    if (registration.participantId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para editar esta inscrição' },
        { status: 403 }
      );
    }

    // Atualizar apenas campos permitidos
    const updateData: any = {};
    if (validatedData.shirtSize !== undefined) {
      updateData.shirtSize = validatedData.shirtSize;
    }

    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: updatedRegistration.id,
      shirtSize: updatedRegistration.shirtSize,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update registration error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar inscrição' }, { status: 500 });
  }
}

// ============================================
// DELETE /api/registrations/[id]
// ============================================
// Cancela uma inscrição (requer autenticação do participante)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const token = extractBearerToken(authHeader);
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação inválido' },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Buscar inscrição e verificar se pertence ao participante autenticado
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        participant: true,
        event: {
          include: {
            kit: {
              include: {
                sizes: true,
              },
            },
          },
        },
        modality: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Inscrição não encontrada' }, { status: 404 });
    }

    // Verificar se o participante autenticado é o dono da inscrição
    if (registration.participantId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para cancelar esta inscrição' },
        { status: 403 }
      );
    }

    // Verificar se já está cancelada
    if (registration.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Inscrição já está cancelada' }, { status: 400 });
    }

    // Verificar se pode cancelar (apenas antes da data do evento ou se ainda não foi confirmada)
    const now = new Date();
    const eventDate = new Date(registration.event.eventDate);

    // Permitir cancelar se:
    // 1. Status é PENDING (não confirmada)
    // 2. Status é CONFIRMED mas evento ainda não aconteceu (dentro de 24h antes)
    if (registration.status === 'CONFIRMED') {
      const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilEvent < 24) {
        return NextResponse.json(
          { error: 'Não é possível cancelar inscrição confirmada com menos de 24h para o evento' },
          { status: 400 }
        );
      }
    }

    // Atualizar status para CANCELLED
    const cancelledRegistration = await prisma.registration.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        // Se estava confirmada (paga), marcar como reembolsado; se pendente, apenas cancelado
        paymentStatus: registration.status === 'CONFIRMED' && registration.paymentStatus === 'APPROVED' 
          ? 'REFUNDED' 
          : 'CANCELLED',
      },
    });

    // Se tinha kit com tamanho reservado, liberar estoque
    if (registration.event.kit && registration.shirtSize) {
      const sizeStock = registration.event.kit.sizes.find(
        (s) => s.size === registration.shirtSize
      );

      if (sizeStock && sizeStock.reserved > 0) {
        try {
          await prisma.kitSizeStock.update({
            where: { id: sizeStock.id },
            data: {
              reserved: {
                decrement: 1,
              },
            },
          });
        } catch (error) {
          console.error('Erro ao liberar estoque do kit:', error);
          // Não falhar o cancelamento por causa disso
        }
      }
    }

    // Decrementar soldSlots da modalidade se estava confirmada
    if (registration.status === 'CONFIRMED') {
      try {
        await prisma.modality.update({
          where: { id: registration.modalityId },
          data: {
            soldSlots: {
              decrement: 1,
            },
          },
        });
      } catch (error) {
        console.error('Erro ao atualizar soldSlots da modalidade:', error);
        // Não falhar o cancelamento por causa disso
      }
    }

    console.log('[DELETE Registration] Inscrição cancelada com sucesso:', cancelledRegistration.id);

    return NextResponse.json({
      id: cancelledRegistration.id,
      status: cancelledRegistration.status,
      cancelledAt: cancelledRegistration.cancelledAt?.toISOString(),
    });
  } catch (error) {
    console.error('[DELETE Registration] Erro ao cancelar inscrição:', error);
    
    // Se for erro de autenticação, retornar 401
    if (error instanceof Error && error.message.includes('Invalid access token')) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao cancelar inscrição' },
      { status: 500 }
    );
  }
}
