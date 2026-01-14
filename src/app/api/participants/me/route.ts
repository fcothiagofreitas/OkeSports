import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';

/**
 * GET /api/participants/me
 * Retorna dados do participante logado, incluindo shirtSize da última inscrição
 */
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

    const userId = decoded.userId;

    // Buscar participante
    const participant = await prisma.participant.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        cpf: true,
        email: true,
        phone: true,
        birthDate: true,
        gender: true,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Participante não encontrado' },
        { status: 404 }
      );
    }

    // Buscar shirtSize da última inscrição do participante
    const lastRegistration = await prisma.registration.findFirst({
      where: {
        participantId: userId,
        shirtSize: { not: null }, // Apenas se tiver shirtSize
      },
      select: {
        shirtSize: true,
      },
      orderBy: {
        createdAt: 'desc', // Mais recente primeiro
      },
    });

    return NextResponse.json({
      ...participant,
      shirtSize: lastRegistration?.shirtSize || null,
    });
  } catch (error) {
    console.error('Error fetching participant data:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do participante' },
      { status: 500 }
    );
  }
}
