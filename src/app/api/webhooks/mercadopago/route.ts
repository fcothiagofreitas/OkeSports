import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { mercadoPagoWebhookSchema } from '@/lib/validations/webhook';
import {
  incrementCouponUsage,
  incrementBatchSales,
  incrementModalitySoldSlots,
} from '@/lib/pricing';
import { ZodError } from 'zod';

// ============================================
// POST /api/webhooks/mercadopago
// ============================================
// Recebe notificações do Mercado Pago sobre pagamentos
// Webhook configurado no painel do MP

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar payload do webhook
    const webhook = mercadoPagoWebhookSchema.parse(body);

    // Log para debug
    console.log('Webhook MP recebido:', {
      type: webhook.type,
      action: webhook.action,
      paymentId: webhook.data.id,
    });

    // Processar apenas notificações de pagamento
    if (webhook.type !== 'payment') {
      return NextResponse.json({ message: 'Tipo ignorado' }, { status: 200 });
    }

    // Buscar inscrição pelo paymentId
    const registration = await prisma.registration.findFirst({
      where: {
        paymentId: webhook.data.id,
      },
      include: {
        event: {
          select: {
            id: true,
            organizerId: true,
            organizer: {
              select: {
                mpAccessToken: true,
              },
            },
          },
        },
        modality: {
          select: {
            id: true,
          },
        },
        coupon: {
          select: {
            id: true,
          },
        },
        participant: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!registration) {
      console.warn('Inscrição não encontrada para payment:', webhook.data.id);
      return NextResponse.json({ message: 'Inscrição não encontrada' }, { status: 404 });
    }

    // Buscar detalhes do pagamento no Mercado Pago
    const { decryptOAuthTokens } = await import('@/lib/mercadopago');
    const { accessToken: mpAccessToken } = decryptOAuthTokens({
      encryptedAccessToken: registration.event.organizer.mpAccessToken!,
      encryptedRefreshToken: '',
    });

    const paymentDetails = await fetch(
      `https://api.mercadopago.com/v1/payments/${webhook.data.id}`,
      {
        headers: { Authorization: `Bearer ${mpAccessToken}` },
      }
    );

    if (!paymentDetails.ok) {
      console.error('Erro ao buscar pagamento no MP:', await paymentDetails.text());
      return NextResponse.json({ error: 'Erro ao buscar pagamento' }, { status: 500 });
    }

    const payment = await paymentDetails.json();
    const paymentStatus = payment.status;
    const paymentMethod = payment.payment_type_id;

    // Processar baseado no status
    if (paymentStatus === 'approved') {
      // 1. Atualizar inscrição
      await prisma.registration.update({
        where: { id: registration.id },
        data: {
          paymentStatus: 'APPROVED',
          status: 'CONFIRMED',
          paymentMethod,
          paidAt: new Date(),
        },
      });

      // 2. Incrementar uso do cupom (se usado)
      if (registration.coupon) {
        await incrementCouponUsage(registration.coupon.id);
      }

      // 3. Incrementar vendas do lote
      await incrementBatchSales(registration.event.id);

      // 4. Incrementar slots vendidos da modalidade
      await incrementModalitySoldSlots(registration.modality.id);

      console.log('Pagamento aprovado e processado:', {
        registrationId: registration.id,
        participantEmail: registration.participant.email,
      });

      // TODO: Enviar email de confirmação
      // await sendConfirmationEmail(registration);

      return NextResponse.json({ message: 'Pagamento processado com sucesso' });
    } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
      // Atualizar como cancelado
      await prisma.registration.update({
        where: { id: registration.id },
        data: {
          paymentStatus: paymentStatus === 'rejected' ? 'REJECTED' : 'CANCELLED',
          status: 'CANCELLED',
        },
      });

      console.log('Pagamento cancelado/rejeitado:', {
        registrationId: registration.id,
        status: paymentStatus,
      });

      return NextResponse.json({ message: 'Pagamento cancelado' });
    }

    // Status intermediário (pending, in_process, etc)
    return NextResponse.json({ message: 'Status recebido' });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Webhook validation error:', error.errors);
      return NextResponse.json(
        { error: 'Payload inválido', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 });
  }
}

// GET para validação da URL do webhook (MP faz um GET para testar)
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
