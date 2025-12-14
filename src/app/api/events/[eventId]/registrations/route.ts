import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware/auth';

// ============================================
// GET /api/events/[eventId]/registrations
// ============================================
// Lista todas as inscrições de um evento
// Requer autenticação e que o usuário seja o organizador do evento

async function getRegistrations(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const userId = request.user.userId;

    // Verificar se o evento existe e pertence ao organizador
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, organizerId: true, name: true },
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

    // Buscar inscrições com dados do participante e modalidade
    const registrations = await prisma.registration.findMany({
      where: { eventId },
      include: {
        participant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            cpf: true,
            phone: true,
          },
        },
        modality: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        coupon: {
          select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Formatar resposta
    const formattedRegistrations = registrations.map((reg) => ({
      id: reg.id,
      registrationNumber: reg.registrationNumber,
      participant: {
        id: reg.participant.id,
        fullName: reg.participant.fullName,
        email: reg.participant.email,
        cpf: reg.participant.cpf,
        phone: reg.participant.phone,
      },
      modality: {
        id: reg.modality.id,
        name: reg.modality.name,
        price: Number(reg.modality.price),
      },
      basePrice: Number(reg.basePrice),
      discount: Number(reg.discount),
      subtotal: Number(reg.subtotal),
      platformFee: Number(reg.platformFee),
      total: Number(reg.total),
      paymentStatus: reg.paymentStatus,
      paymentMethod: reg.paymentMethod,
      status: reg.status,
      shirtSize: reg.shirtSize,
      coupon: reg.coupon
        ? {
            code: reg.coupon.code,
            discountType: reg.coupon.discountType,
            discountValue: Number(reg.coupon.discountValue),
          }
        : null,
      createdAt: reg.createdAt.toISOString(),
      confirmedAt: reg.confirmedAt?.toISOString() || null,
      cancelledAt: reg.cancelledAt?.toISOString() || null,
    }));

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
      },
      registrations: formattedRegistrations,
      total: formattedRegistrations.length,
      summary: {
        total: formattedRegistrations.length,
        confirmed: formattedRegistrations.filter((r) => r.status === 'CONFIRMED').length,
        pending: formattedRegistrations.filter((r) => r.status === 'PENDING').length,
        cancelled: formattedRegistrations.filter((r) => r.status === 'CANCELLED').length,
        approved: formattedRegistrations.filter((r) => r.paymentStatus === 'APPROVED').length,
        totalRevenue: formattedRegistrations
          .filter((r) => r.paymentStatus === 'APPROVED')
          .reduce((sum, r) => sum + Number(r.total), 0),
      },
    });
  } catch (error) {
    console.error('List registrations error:', error);
    return NextResponse.json({ error: 'Erro ao buscar inscrições' }, { status: 500 });
  }
}

export const GET = withAuth(getRegistrations);

