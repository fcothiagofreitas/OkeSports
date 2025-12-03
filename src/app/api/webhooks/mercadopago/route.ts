import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
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

function verifySignature({
  rawBody,
  signatureHeader,
  requestUrl,
}: {
  rawBody: string;
  signatureHeader: string | null;
  requestUrl: string;
}): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) {
    return true;
  }

  const tsMatch = signatureHeader.match(/ts=(\d+)/);
  const v1Match = signatureHeader.match(/v1=([^,]+)/);

  if (!tsMatch || !v1Match) {
    return false;
  }

  const timestamp = tsMatch[1];
  const signature = v1Match[1];
  const payload = `${timestamp}.${requestUrl}.${rawBody}`;
  const computed = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const signatureBuffer = Buffer.from(signature);
  const computedBuffer = Buffer.from(computed);

  if (signatureBuffer.length !== computedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, computedBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let body: unknown;

    try {
      body = JSON.parse(rawBody || '{}');
    } catch {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const signatureHeader = request.headers.get('x-signature');
    const expectedUrl =
      process.env.MP_WEBHOOK_URL ||
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://dev.okesports.com.br'}/api/webhooks/mercadopago`;

    if (!verifySignature({ rawBody, signatureHeader, requestUrl: expectedUrl })) {
      console.warn('Assinatura do webhook Mercado Pago inválida');
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    }

    // Idempotência: usar x-request-id para evitar processamento duplicado
    const requestId = request.headers.get('x-request-id');
    if (requestId) {
      const alreadyProcessed = await prisma.processedWebhook.findUnique({
        where: { requestId },
      });

      if (alreadyProcessed) {
        console.log('Webhook MP ignorado (idempotência) para x-request-id:', requestId);
        return NextResponse.json({ message: 'Webhook já processado' }, { status: 200 });
      }
    }

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
    // TODO: armazenar e usar também o refresh_token para renovar access tokens se necessário
    const { accessToken: mpAccessToken } = decryptOAuthTokens({
      encryptedAccessToken: registration.event.organizer.mpAccessToken!,
      encryptedRefreshToken: registration.event.organizer.mpAccessToken!, // placeholder para manter assinatura da função; não é usado aqui
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
          confirmedAt: new Date(),
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

      // Registrar webhook como processado (idempotência)
      if (requestId) {
        await prisma.processedWebhook.create({
          data: {
            requestId,
          },
        });
      }

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

      // Registrar webhook como processado (idempotência)
      if (requestId) {
        await prisma.processedWebhook.create({
          data: {
            requestId,
          },
        });
      }

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
