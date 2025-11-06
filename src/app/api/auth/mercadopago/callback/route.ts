import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  exchangeCodeForTokens,
  encryptOAuthTokens,
  calculateTokenExpiration,
  getMercadoPagoUserInfo,
} from '@/lib/mercadopago';

// ============================================
// GET /api/auth/mercadopago/callback
// ============================================
// Callback do OAuth do Mercado Pago
// Processa código de autorização e salva tokens

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId
  const error = searchParams.get('error');

  // Verificar se houve erro no OAuth
  if (error) {
    console.error('Mercado Pago OAuth error:', error);
    return NextResponse.redirect(
      new URL(
        `/dashboard?mp_error=${encodeURIComponent(error)}`,
        request.nextUrl.origin
      )
    );
  }

  // Validar parâmetros
  if (!code || !state) {
    return NextResponse.json(
      { error: 'Código ou state não fornecidos' },
      { status: 400 }
    );
  }

  const userId = state;

  try {
    // 1. Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, mpConnected: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // 2. Trocar código por tokens
    const tokenResponse = await exchangeCodeForTokens(code);

    // 3. Buscar informações do usuário MP
    const mpUserInfo = await getMercadoPagoUserInfo(tokenResponse.access_token);

    // 4. Encriptar tokens para armazenar no banco
    const { encryptedAccessToken, encryptedRefreshToken } = encryptOAuthTokens({
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
    });

    // 5. Calcular data de expiração
    const expiresAt = calculateTokenExpiration(tokenResponse.expires_in);

    // 6. Atualizar usuário no banco
    await prisma.user.update({
      where: { id: userId },
      data: {
        mpConnected: true,
        mpUserId: mpUserInfo.id.toString(),
        mpAccessToken: encryptedAccessToken,
        mpRefreshToken: encryptedRefreshToken,
        mpPublicKey: tokenResponse.public_key,
        mpTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
    });

    // 7. Redirecionar para dashboard com sucesso
    return NextResponse.redirect(
      new URL('/dashboard?mp_connected=true', request.nextUrl.origin)
    );
  } catch (error) {
    console.error('Mercado Pago callback error:', error);

    // Redirecionar para dashboard com erro
    const errorMessage =
      error instanceof Error ? error.message : 'Erro ao conectar Mercado Pago';

    return NextResponse.redirect(
      new URL(
        `/dashboard?mp_error=${encodeURIComponent(errorMessage)}`,
        request.nextUrl.origin
      )
    );
  }
}
