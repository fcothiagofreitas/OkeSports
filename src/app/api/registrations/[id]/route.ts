import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import type { RegistrationStatus } from '@/types/checkout';

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
