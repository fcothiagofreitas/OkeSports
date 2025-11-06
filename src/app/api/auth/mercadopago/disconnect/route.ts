import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import prisma from '@/lib/db';

// ============================================
// DELETE /api/auth/mercadopago/disconnect
// ============================================
// Desconecta conta do Mercado Pago
// Remove tokens OAuth e dados relacionados

async function handler(request: NextRequest & { user: { userId: string } }) {
  try {
    const { userId } = request.user;

    // Verificar se usuário tem MP conectado
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mpConnected: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (!user.mpConnected) {
      return NextResponse.json(
        { error: 'Mercado Pago não conectado' },
        { status: 400 }
      );
    }

    // Remover tokens e dados OAuth do banco
    await prisma.user.update({
      where: { id: userId },
      data: {
        mpConnected: false,
        mpUserId: null,
        mpAccessToken: null,
        mpRefreshToken: null,
        mpPublicKey: null,
        mpTokenExpiresAt: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Mercado Pago desconectado com sucesso',
    });
  } catch (error) {
    console.error('Mercado Pago disconnect error:', error);
    return NextResponse.json(
      { error: 'Erro ao desconectar Mercado Pago' },
      { status: 500 }
    );
  }
}

export const DELETE = withAuth(handler);
