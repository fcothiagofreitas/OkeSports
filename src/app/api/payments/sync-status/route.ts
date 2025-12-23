import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { decryptOAuthTokens } from '@/lib/mercadopago';
import { withAuth } from '@/lib/middleware/auth';

const syncStatusSchema = z.object({
  registrationId: z.string().cuid().optional(),
  paymentId: z.string().optional(),
});

/**
 * Sincroniza o status de um pagamento com o Mercado Pago
 * Útil para verificar pagamentos que não foram atualizados via webhook
 */
async function syncPaymentStatus(request: NextRequest) {
  try {
    const body = await request.json();
    const { registrationId, paymentId } = syncStatusSchema.parse(body);

    if (!registrationId && !paymentId) {
      return NextResponse.json(
        { error: 'registrationId ou paymentId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar inscrição
    let registration;
    if (registrationId) {
      registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: {
          event: {
            include: {
              organizer: {
                select: {
                  mpAccessToken: true,
                },
              },
            },
          },
        },
      });
    } else if (paymentId) {
      registration = await prisma.registration.findFirst({
        where: { paymentId },
        include: {
          event: {
            include: {
              organizer: {
                select: {
                  mpAccessToken: true,
                },
              },
            },
          },
        },
      });
    }

    if (!registration) {
      return NextResponse.json(
        { error: 'Inscrição não encontrada' },
        { status: 404 }
      );
    }

    // Se não tem paymentId, tentar buscar pelo external_reference
    let mpPaymentId = registration.paymentId;
    if (!mpPaymentId && registrationId) {
      // Buscar payment no MP usando external_reference
      try {
        const appToken = process.env.MP_TEST_ACCESS_TOKEN || process.env.MP_TEST_SELLER_TOKEN;
        if (appToken) {
          // Buscar payments com external_reference
          const searchResponse = await fetch(
            `https://api.mercadopago.com/v1/payments/search?external_reference=${registrationId}`,
            {
              headers: { Authorization: `Bearer ${appToken}` },
            }
          );

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.results && searchData.results.length > 0) {
              mpPaymentId = searchData.results[0].id.toString();
            }
          }
        }
      } catch (error) {
        console.warn('Erro ao buscar payment por external_reference:', error);
      }
    }

    if (!mpPaymentId) {
      return NextResponse.json(
        { error: 'Payment ID não encontrado. O pagamento pode não ter sido criado ainda.' },
        { status: 404 }
      );
    }

    // Buscar detalhes do pagamento no Mercado Pago
    const { accessToken: mpAccessToken } = decryptOAuthTokens({
      encryptedAccessToken: registration.event.organizer.mpAccessToken!,
      encryptedRefreshToken: '',
    });

    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${mpPaymentId}`,
      {
        headers: { Authorization: `Bearer ${mpAccessToken}` },
      }
    );

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error('Erro ao buscar pagamento no MP:', errorText);
      return NextResponse.json(
        { error: 'Erro ao buscar pagamento no Mercado Pago', details: errorText },
        { status: 500 }
      );
    }

    const payment = await paymentResponse.json();
    const paymentStatus = payment.status;

    // Atualizar status baseado no status do MP
    if (paymentStatus === 'approved' && registration.status !== 'CONFIRMED') {
      await prisma.registration.update({
        where: { id: registration.id },
        data: {
          paymentId: mpPaymentId,
          paymentStatus: 'APPROVED',
          status: 'CONFIRMED',
          paymentMethod: payment.payment_type_id,
          confirmedAt: new Date(),
        },
      });

      return NextResponse.json({
        message: 'Status atualizado para CONFIRMED',
        registrationId: registration.id,
        paymentId: mpPaymentId,
        status: 'CONFIRMED',
        paymentStatus: 'APPROVED',
      });
    } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
      await prisma.registration.update({
        where: { id: registration.id },
        data: {
          paymentId: mpPaymentId,
          paymentStatus: paymentStatus === 'rejected' ? 'REJECTED' : 'CANCELLED',
          status: 'CANCELLED',
        },
      });

      return NextResponse.json({
        message: 'Status atualizado para CANCELLED',
        registrationId: registration.id,
        paymentId: mpPaymentId,
        status: 'CANCELLED',
        paymentStatus: paymentStatus === 'rejected' ? 'REJECTED' : 'CANCELLED',
      });
    }

    return NextResponse.json({
      message: 'Status já está atualizado ou é intermediário',
      registrationId: registration.id,
      paymentId: mpPaymentId,
      currentStatus: registration.status,
      mpStatus: paymentStatus,
    });
  } catch (error) {
    console.error('Erro ao sincronizar status:', error);
    return NextResponse.json(
      {
        error: 'Erro ao sincronizar status',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export const POST = withAuth(syncPaymentStatus);

