import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  exchangeCodeForTokens,
  encryptOAuthTokens,
  decryptOAuthTokens,
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
        `/app?mp_error=${encodeURIComponent(error)}`,
        process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
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
    console.log('🔐 Encriptando tokens OAuth...');
    console.log('📋 Access Token (antes de encriptar):', tokenResponse.access_token.substring(0, 20) + '...');
    
    const { encryptedAccessToken, encryptedRefreshToken } = encryptOAuthTokens({
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
    });

    // Verificar formato do token encriptado
    const tokenParts = encryptedAccessToken.split(':');
    console.log('✅ Token encriptado:', {
      parts: tokenParts.length,
      format: tokenParts.length === 3 ? 'CORRETO (iv:authTag:encrypted)' : 'INCORRETO',
      preview: encryptedAccessToken.substring(0, 50) + '...',
    });

    if (tokenParts.length !== 3) {
      console.error('❌ ERRO: Token encriptado não está no formato correto!');
      console.error('❌ Esperado: iv:authTag:encrypted (3 partes)');
      console.error('❌ Recebido:', tokenParts.length, 'partes');
      throw new Error('Erro ao encriptar token: formato inválido');
    }

    // 5. Calcular data de expiração
    const expiresAt = calculateTokenExpiration(tokenResponse.expires_in);

    // 6. Atualizar usuário no banco
    console.log('💾 Atualizando usuário no banco de dados...');
    console.log('👤 User ID:', userId);
    
    const updatedUser = await prisma.user.update({
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
      select: {
        id: true,
        email: true,
        mpConnected: true,
        mpUserId: true,
        mpAccessToken: true,
        mpPublicKey: true,
        mpTokenExpiresAt: true,
        updatedAt: true,
      },
    });

    // Verificar se foi atualizado corretamente
    const savedTokenParts = updatedUser.mpAccessToken?.split(':') || [];
    console.log('✅ Usuário atualizado:', {
      id: updatedUser.id,
      email: updatedUser.email,
      mpConnected: updatedUser.mpConnected,
      mpUserId: updatedUser.mpUserId,
      tokenFormat: savedTokenParts.length === 3 ? 'CORRETO' : 'INCORRETO',
      tokenParts: savedTokenParts.length,
      tokenPreview: updatedUser.mpAccessToken?.substring(0, 50) + '...',
      updatedAt: updatedUser.updatedAt,
    });

    if (savedTokenParts.length !== 3) {
      console.error('❌ ERRO CRÍTICO: Token salvo no banco não está no formato correto!');
      console.error('❌ Isso causará erro ao descriptografar posteriormente.');
    }

    // 6.5. Testar descriptografia imediatamente para garantir que funciona
    console.log('🧪 Testando descriptografia do token salvo...');
    try {
      const decrypted = decryptOAuthTokens({
        encryptedAccessToken: updatedUser.mpAccessToken!,
        encryptedRefreshToken: encryptedRefreshToken,
      });
      
      console.log('✅ Teste de descriptografia: SUCESSO');
      console.log('📋 Token descriptografado (primeiros 20 chars):', decrypted.accessToken.substring(0, 20) + '...');
      console.log('🔍 Token original (primeiros 20 chars):', tokenResponse.access_token.substring(0, 20) + '...');
      
      if (decrypted.accessToken !== tokenResponse.access_token) {
        console.error('❌ ERRO: Token descriptografado não corresponde ao original!');
      } else {
        console.log('✅ Tokens correspondem perfeitamente!');
      }
    } catch (decryptError) {
      console.error('❌ ERRO CRÍTICO ao testar descriptografia:', decryptError);
      console.error('❌ Isso significa que o token NÃO poderá ser usado posteriormente!');
      console.error('💡 Possíveis causas:');
      console.error('   1. ENCRYPTION_KEY mudou após encriptar');
      console.error('   2. Formato do token está incorreto');
      console.error('   3. Token foi corrompido durante o salvamento');
    }

    // 7. Redirecionar para dashboard com sucesso
    return NextResponse.redirect(
      new URL('/app?mp_connected=true', process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin)
    );
  } catch (error) {
    console.error('Mercado Pago callback error:', error);

    // Redirecionar para dashboard com erro
    const errorMessage =
      error instanceof Error ? error.message : 'Erro ao conectar Mercado Pago';

    return NextResponse.redirect(
      new URL(
        `/app?mp_error=${encodeURIComponent(errorMessage)}`,
        process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
      )
    );
  }
}
