import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { calculatePrice } from '@/lib/pricing';

// ============================================
// POST /api/events/[eventId]/coupons/validate
// ============================================
// Valida um cupom e retorna o cálculo de preço atualizado

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    const { couponCode, modalityId } = body;

    if (!modalityId) {
      return NextResponse.json({ error: 'Modalidade é obrigatória' }, { status: 400 });
    }

    // Calcular preço com cupom
    const pricing = await calculatePrice(eventId, modalityId, couponCode);

    return NextResponse.json({
      valid: !!pricing.couponCode,
      pricing,
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : 'Erro ao validar cupom',
        pricing: null,
      },
      { status: 400 }
    );
  }
}

