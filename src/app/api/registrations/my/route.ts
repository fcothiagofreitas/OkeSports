import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
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

    // Buscar inscrições onde o participante é o inscrito OU o comprador
    // Isso permite ver todas as inscrições que o usuário fez (incluindo para outras pessoas)
    const registrations = await prisma.registration.findMany({
      where: {
        OR: [
          { participantId }, // Inscrições onde o usuário é o participante
          { buyerId: participantId }, // Inscrições onde o usuário é o comprador
        ],
      },
      select: {
        id: true,
        registrationNumber: true,
        status: true,
        paymentStatus: true,
        total: true,
        createdAt: true,
        shirtSize: true,
        buyerId: true,
        paymentId: true,
        eventId: true,
        participantId: true,
        participant: {
          select: {
            fullName: true,
            cpf: true,
          },
        },
        event: {
          select: {
            name: true,
            slug: true,
            eventDate: true,
            bannerUrl: true,
          },
        },
        modality: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ registrations });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar inscrições' },
      { status: 500 }
    );
  }
}
