import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import prisma from '@/lib/db';
import { isTokenExpired, refreshMercadoPagoToken, encryptOAuthTokens, calculateTokenExpiration } from '@/lib/mercadopago';

// ============================================
// GET /api/auth/mercadopago/status
// ============================================
// Verifica status da conexão com Mercado Pago
// Renova token automaticamente se expirado

async function handler(request: NextRequest & { user: { userId: string } }) {
  try {
    const { userId } = request.user;

    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        mpConnected: true,
        mpUserId: true,
        mpPublicKey: true,
        mpTokenExpiresAt: true,
        mpRefreshToken: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Se não está conectado
    if (!user.mpConnected) {
      return NextResponse.json({
        connected: false,
        message: 'Mercado Pago não conectado',
      });
    }

    // Verificar se token expirou
    const tokenExpired = isTokenExpired(user.mpTokenExpiresAt);

    // Se expirou, tentar renovar
    if (tokenExpired && user.mpRefreshToken) {
      try {
        const newTokens = await refreshMercadoPagoToken(user.mpRefreshToken);

        // Encriptar novos tokens
        const { encryptedAccessToken, encryptedRefreshToken } = encryptOAuthTokens({
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token,
        });

        // Atualizar no banco
        await prisma.user.update({
          where: { id: userId },
          data: {
            mpAccessToken: encryptedAccessToken,
            mpRefreshToken: encryptedRefreshToken,
            mpPublicKey: newTokens.public_key,
            mpTokenExpiresAt: calculateTokenExpiration(newTokens.expires_in),
            updatedAt: new Date(),
          },
        });

        // Retornar status atualizado
        return NextResponse.json({
          connected: true,
          userId: user.mpUserId,
          publicKey: newTokens.public_key,
          tokenExpired: false,
          tokenRenewed: true,
          expiresAt: calculateTokenExpiration(newTokens.expires_in),
        });
      } catch (error) {
        console.error('Failed to refresh Mercado Pago token:', error);

        // Token inválido, marcar como desconectado
        await prisma.user.update({
          where: { id: userId },
          data: {
            mpConnected: false,
            mpAccessToken: null,
            mpRefreshToken: null,
            mpPublicKey: null,
            mpTokenExpiresAt: null,
          },
        });

        return NextResponse.json({
          connected: false,
          error: 'Token expirado e não foi possível renovar. Reconecte sua conta.',
        });
      }
    }

    // Token válido
    return NextResponse.json({
      connected: true,
      userId: user.mpUserId,
      publicKey: user.mpPublicKey,
      tokenExpired: false,
      expiresAt: user.mpTokenExpiresAt,
    });
  } catch (error) {
    console.error('Mercado Pago status error:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar status do Mercado Pago' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
