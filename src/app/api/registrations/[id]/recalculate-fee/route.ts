import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware/auth';
import { decryptOAuthTokens } from '@/lib/mercadopago';

// ============================================
// POST /api/registrations/[id]/recalculate-fee
// ============================================
// Recalcula a taxa do Mercado Pago para uma inscrição já aprovada
// Útil para inscrições que foram aprovadas antes de implementar o cálculo da taxa

async function recalculateFee(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params;
    const userId = request.user.userId;

    // Buscar inscrição
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          select: {
            organizerId: true,
            organizer: {
              select: {
                mpAccessToken: true,
                mpConnected: true,
              },
            },
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Inscrição não encontrada' }, { status: 404 });
    }

    // Verificar permissão
    if (registration.event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar esta inscrição' },
        { status: 403 }
      );
    }

    // Verificar se tem paymentId
    if (!registration.paymentId) {
      return NextResponse.json(
        { error: 'Inscrição não tem paymentId do Mercado Pago' },
        { status: 400 }
      );
    }

    // Verificar se está aprovada
    if (registration.paymentStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Apenas inscrições aprovadas podem ter a taxa recalculada' },
        { status: 400 }
      );
    }

    // Buscar detalhes do pagamento no Mercado Pago
    if (!registration.event.organizer.mpConnected || !registration.event.organizer.mpAccessToken) {
      return NextResponse.json(
        { error: 'Organizador não tem Mercado Pago configurado' },
        { status: 400 }
      );
    }

    const { accessToken: mpAccessToken } = decryptOAuthTokens({
      encryptedAccessToken: registration.event.organizer.mpAccessToken,
      encryptedRefreshToken: '',
    });

    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${registration.paymentId}`,
      {
        headers: { Authorization: `Bearer ${mpAccessToken}` },
      }
    );

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error('Erro ao buscar pagamento no MP:', errorText);
      return NextResponse.json(
        { error: 'Erro ao buscar pagamento no Mercado Pago' },
        { status: 500 }
      );
    }

    const payment = await paymentResponse.json();
    const transactionDetails = payment.transaction_details;
    const transactionAmount = payment.transaction_amount;
    const marketplaceFee = payment.marketplace_fee || Number(registration.platformFee) || 0;

    let mercadoPagoFee: number | null = null;

    if (transactionDetails) {
      const netReceived = transactionDetails.net_received_amount;

      // Método 1: fee_details
      if (transactionDetails.fee_details && Array.isArray(transactionDetails.fee_details)) {
        const totalFees = transactionDetails.fee_details.reduce(
          (sum: number, fee: any) => sum + (Number(fee.amount) || 0),
          0
        );
        if (totalFees > 0) {
          mercadoPagoFee = totalFees;
        }
      }

      // Método 2: net_received_amount
      if (mercadoPagoFee === null && netReceived !== undefined && transactionAmount) {
        mercadoPagoFee = transactionAmount - netReceived - marketplaceFee;
        if (mercadoPagoFee <= 0) {
          mercadoPagoFee = null;
        }
      }

      // Método 3: total_paid_amount
      if (mercadoPagoFee === null && transactionDetails.total_paid_amount) {
        const totalPaid = transactionDetails.total_paid_amount;
        const netReceived = transactionDetails.net_received_amount;
        if (netReceived !== undefined) {
          mercadoPagoFee = totalPaid - netReceived - marketplaceFee;
          if (mercadoPagoFee <= 0) {
            mercadoPagoFee = null;
          }
        }
      }
    }

    // Atualizar inscrição
    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        mercadoPagoFee: mercadoPagoFee ? mercadoPagoFee : null,
      },
    });

    return NextResponse.json({
      success: true,
      mercadoPagoFee,
      registration: {
        id: updated.id,
        mercadoPagoFee: updated.mercadoPagoFee ? Number(updated.mercadoPagoFee) : null,
      },
      debug: {
        transactionAmount,
        netReceived: transactionDetails?.net_received_amount,
        marketplaceFee,
        hasFeeDetails: !!transactionDetails?.fee_details,
      },
    });
  } catch (error) {
    console.error('Erro ao recalcular taxa:', error);
    return NextResponse.json(
      { error: 'Erro ao recalcular taxa do Mercado Pago' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(recalculateFee);

