import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { decryptOAuthTokens } from '@/lib/mercadopago';

const createPreferenceSchema = z.object({
  registrationId: z.string().cuid(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Validar dados
    const body = await request.json();
    const { registrationId } = createPreferenceSchema.parse(body);

    // 2. Buscar inscrição
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          include: {
            organizer: {
              select: {
                mpAccessToken: true,
                mpConnected: true,
              },
            },
          },
        },
        modality: {
          select: {
            name: true,
          },
        },
        participant: {
          select: {
            email: true,
            fullName: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Inscrição não encontrada' },
        { status: 404 }
      );
    }

    if (registration.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Inscrição já foi processada' },
        { status: 400 }
      );
    }

    if (!registration.event.organizer.mpConnected || !registration.event.organizer.mpAccessToken) {
      return NextResponse.json(
        { error: 'Organizador não tem Mercado Pago configurado' },
        { status: 400 }
      );
    }

    // 3. Obter access token
    // Em desenvolvimento, usar token de teste do .env
    let accessToken: string;

    if (process.env.NODE_ENV === 'development' && process.env.MP_TEST_ACCESS_TOKEN) {
      accessToken = process.env.MP_TEST_ACCESS_TOKEN;
      console.log('🧪 Usando credenciais de teste do Mercado Pago');
    } else {
      // Em produção, descriptografar token do organizador
      try {
        accessToken = decryptOAuthTokens({
          encryptedAccessToken: registration.event.organizer.mpAccessToken,
          encryptedRefreshToken: '', // Não precisamos agora
        }).accessToken;
      } catch (error) {
        console.error('Error decrypting access token:', error);
        return NextResponse.json(
          { error: 'Erro ao processar credenciais de pagamento' },
          { status: 500 }
        );
      }
    }

    // 4. Criar preference no Mercado Pago
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const preferenceData = {
      items: [
        {
          id: registration.modalityId,
          title: `${registration.event.name} - ${registration.modality.name}`,
          description: `Inscrição #${registration.registrationNumber}`,
          category_id: 'tickets',
          quantity: 1,
          unit_price: Number(registration.total),
        },
      ],
      payer: {
        name: registration.participant.fullName,
        email: registration.participant.email,
      },
      back_urls: {
        success: `${appUrl}/inscricao/sucesso?id=${registrationId}`,
        failure: `${appUrl}/inscricao/falha?id=${registrationId}`,
        pending: `${appUrl}/inscricao/pendente?id=${registrationId}`,
      },
      auto_return: 'approved',
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      external_reference: registrationId,
      statement_descriptor: 'OKESPORTS',
      metadata: {
        registration_id: registrationId,
        event_id: registration.eventId,
        modality_id: registration.modalityId,
        participant_id: registration.participantId,
      },
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferenceData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Mercado Pago API error:', error);
      return NextResponse.json(
        { error: 'Erro ao criar checkout no Mercado Pago' },
        { status: 500 }
      );
    }

    const preference = await response.json();

    // 5. Retornar URL de checkout
    return NextResponse.json({
      checkoutUrl: preference.init_point,
      preferenceId: preference.id,
    });
  } catch (error) {
    console.error('Error creating preference:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar checkout' },
      { status: 500 }
    );
  }
}
