import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';

/**
 * GET /api/participants/recent
 * Retorna participantes que o usuário já usou em inscrições anteriores
 * (participantes onde buyerId = userId do usuário logado)
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

    // Buscar participantes únicos que o usuário já inscreveu (onde buyerId = userId)
    // EXCLUIR o próprio usuário da lista (participantId = userId)
    // Usar groupBy para garantir que pegamos o shirtSize da inscrição mais recente
    const allRegistrations = await prisma.registration.findMany({
      where: {
        buyerId: userId, // Apenas participantes que o usuário inscreveu
        participantId: { not: userId }, // Excluir o próprio usuário
      },
      select: {
        participantId: true,
        participant: {
          select: {
            id: true,
            fullName: true,
            cpf: true,
            email: true,
            phone: true,
            birthDate: true,
            gender: true,
          },
        },
        shirtSize: true, // Tamanho de camisa usado na inscrição
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc', // Mais recentes primeiro
      },
    });

    // Agrupar por participantId e pegar o shirtSize da inscrição mais recente
    const participantsMap = new Map<string, any>();

    allRegistrations.forEach((reg) => {
      const participantId = reg.participantId;
      if (!participantsMap.has(participantId)) {
        // Primeira vez que vemos este participante (já está ordenado por createdAt desc)
        participantsMap.set(participantId, {
          id: reg.participant.id,
          fullName: reg.participant.fullName,
          cpf: reg.participant.cpf,
          email: reg.participant.email,
          phone: reg.participant.phone,
          birthDate: reg.participant.birthDate,
          gender: reg.participant.gender,
          shirtSize: reg.shirtSize, // Tamanho usado na inscrição mais recente
        });
      }
    });

    const participants = Array.from(participantsMap.values());

    return NextResponse.json({ participants });
  } catch (error) {
    console.error('Error fetching recent participants:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar participantes recentes' },
      { status: 500 }
    );
  }
}
