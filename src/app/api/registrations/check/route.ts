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

    // Em desenvolvimento, permitir inscrições repetidas (não verificar existência)
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      console.log('[CHECK REGISTRATION] ⚠️ MODO DESENVOLVIMENTO: Retornando exists=false para permitir testes');
      return NextResponse.json(
        {
          exists: false,
          hasCancelledRegistration: false,
        },
        { status: 200 }
      );
    }

    // 3. Verificar se já existe inscrição ATIVA (ignorar canceladas para permitir re-inscrição)
    const activeRegistration = await prisma.registration.findFirst({
      where: {
        participantId,
        eventId,
        modalityId,
        status: {
          in: ['PENDING', 'CONFIRMED'], // Apenas inscrições ativas
        },
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

    // 4. Verificar se existe inscrição cancelada (para histórico/informação)
    const cancelledRegistration = await prisma.registration.findFirst({
      where: {
        participantId,
        eventId,
        modalityId,
        status: 'CANCELLED',
      },
      orderBy: {
        cancelledAt: 'desc',
      },
      select: {
        cancelledAt: true,
        status: true,
      },
    });

    if (!activeRegistration) {
      return NextResponse.json(
        {
          exists: false,
          hasCancelledRegistration: !!cancelledRegistration,
          cancelledAt: cancelledRegistration?.cancelledAt?.toISOString(),
        },
        { status: 200 }
      );
    }

    // 5. Retornar dados da inscrição ativa existente
    return NextResponse.json(
      {
        exists: true,
        hasCancelledRegistration: !!cancelledRegistration,
        registration: {
          id: activeRegistration.id,
          registrationNumber: activeRegistration.registrationNumber,
          status: activeRegistration.status,
          paymentStatus: activeRegistration.paymentStatus,
          basePrice: Number(activeRegistration.basePrice),
          discount: Number(activeRegistration.discount),
          subtotal: Number(activeRegistration.subtotal),
          platformFee: Number(activeRegistration.platformFee),
          total: Number(activeRegistration.total),
          createdAt: activeRegistration.createdAt,
          event: activeRegistration.event,
          modality: activeRegistration.modality,
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
