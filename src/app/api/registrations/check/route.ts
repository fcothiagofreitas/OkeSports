import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticação do participante
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const participantId = decoded.userId;

    // 2. Obter parâmetros da query
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');
    const modalityId = searchParams.get('modalityId');

    if (!eventId || !modalityId) {
      return NextResponse.json(
        { error: 'eventId e modalityId são obrigatórios' },
        { status: 400 }
      );
    }

    // 3. Verificar se já existe inscrição
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        participantId,
        eventId,
        modalityId,
      },
      include: {
        event: {
          select: {
            name: true,
            slug: true,
          },
        },
        modality: {
          select: {
            name: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!existingRegistration) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    // 4. Retornar dados da inscrição existente
    return NextResponse.json(
      {
        exists: true,
        registration: {
          id: existingRegistration.id,
          registrationNumber: existingRegistration.registrationNumber,
          status: existingRegistration.status,
          paymentStatus: existingRegistration.paymentStatus,
          basePrice: Number(existingRegistration.basePrice),
          discount: Number(existingRegistration.discount),
          subtotal: Number(existingRegistration.subtotal),
          platformFee: Number(existingRegistration.platformFee),
          total: Number(existingRegistration.total),
          createdAt: existingRegistration.createdAt,
          event: existingRegistration.event,
          modality: existingRegistration.modality,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking registration:', error);
    return NextResponse.json(
      {
        error: 'Erro ao verificar inscrição',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
