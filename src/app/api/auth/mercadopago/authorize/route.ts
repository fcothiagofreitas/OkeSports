import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import { generateMercadoPagoAuthUrl } from '@/lib/mercadopago';

// ============================================
// GET /api/auth/mercadopago/authorize
// ============================================
// Inicia fluxo OAuth do Mercado Pago
// Requer autenticação (usuário logado)

async function handler(request: NextRequest & { user: { userId: string } }) {
  try {
    const { userId } = request.user;

    // Gerar URL de autorização do Mercado Pago
    // O state é o userId para validar no callback
    const authUrl = generateMercadoPagoAuthUrl(userId);

    // Retornar URL para o frontend redirecionar
    return NextResponse.json({
      authUrl,
      message: 'Redirecione o usuário para esta URL',
    });
  } catch (error) {
    console.error('Mercado Pago authorize error:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar URL de autorização' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
