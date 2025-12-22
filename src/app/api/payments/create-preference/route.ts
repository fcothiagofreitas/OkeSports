import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { decryptOAuthTokens } from '@/lib/mercadopago';

const createPreferenceSchema = z.object({
  registrationId: z.string().cuid(),
});

/**
 * Cria uma preferência de pagamento no Mercado Pago
 * 
 * Fluxo:
 * 1. Valida dados da requisição
 * 2. Busca inscrição no banco
 * 3. Obtém token OAuth do organizador (ou fallback para tokens de teste)
 * 4. Cria preferência no Mercado Pago com split payments (se habilitado)
 * 5. Retorna URL de checkout (sandbox em teste, produção em produção)
 * 
 * Nota: Split payments pode ter limitações no sandbox do Mercado Pago.
 * Use DISABLE_SPLIT_PAYMENTS_TEST=true no .env para testar sem split.
 */
export async function POST(request: NextRequest) {
  try {
    // ============================================
    // 1. VALIDAÇÃO E PREPARAÇÃO
    // ============================================
    const body = await request.json();
    const { registrationId } = createPreferenceSchema.parse(body);

    // ============================================
    // 2. BUSCAR INSCRIÇÃO
    // ============================================
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          include: {
            organizer: {
              select: {
                mpAccessToken: true,
                mpConnected: true,
                mpUserId: true,
              },
            },
          },
        },
        modality: {
          select: { name: true },
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

    // ============================================
    // 3. OBTER ACCESS TOKEN DO MERCADO PAGO
    // ============================================
    // Prioridade: Token OAuth do organizador > MP_TEST_SELLER_TOKEN > MP_TEST_ACCESS_TOKEN
    let accessToken: string | undefined;
    let isTestMode = false;
    let supportsSplitPayments = false;

    // Prioridade 1: Token OAuth do organizador
    if (registration.event.organizer.mpAccessToken?.trim()) {
      try {
        const tokens = decryptOAuthTokens({
          encryptedAccessToken: registration.event.organizer.mpAccessToken,
          encryptedRefreshToken: '',
        });
        
        accessToken = tokens.accessToken;
        supportsSplitPayments = true;
        
        // Detectar se é token de teste
        const clientId = process.env.MP_CLIENT_ID || '';
        isTestMode = 
          accessToken.startsWith('TEST-') ||
          (/^\d+$/.test(clientId) && accessToken.startsWith('APP_USR-'));
      } catch (error) {
        console.error('❌ Erro ao descriptografar token OAuth:', error instanceof Error ? error.message : String(error));
        // Continuar para tentar fallback
      }
    }

    // Prioridade 2: Token de teste do Vendedor (conta3)
    if (!accessToken && process.env.MP_TEST_SELLER_TOKEN) {
      accessToken = process.env.MP_TEST_SELLER_TOKEN;
      isTestMode = true;
      supportsSplitPayments = true;
    }

    // Prioridade 3: Token de teste da aplicação (conta1 - Integrador)
    if (!accessToken && process.env.MP_TEST_ACCESS_TOKEN) {
      accessToken = process.env.MP_TEST_ACCESS_TOKEN;
      isTestMode = true;
      supportsSplitPayments = false; // Não suporta split
    }

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'Organizador precisa conectar conta Mercado Pago para realizar pagamentos',
          requiresOAuth: true,
        },
        { status: 400 }
      );
    }

    // ============================================
    // 4. CRIAR PREFERÊNCIA NO MERCADO PAGO
    // ============================================
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const platformFee = Number(registration.platformFee);
    const total = Number(registration.total);
    const subtotal = Number(registration.subtotal);

    // Verificar se deve desabilitar split payments em teste
    const disableSplitInTest = process.env.DISABLE_SPLIT_PAYMENTS_TEST === 'true';
    const enableSplitPayments = supportsSplitPayments && platformFee > 0 && !(isTestMode && disableSplitInTest);

    const preferenceData: any = {
      items: [
        {
          id: registration.modalityId,
          title: `${registration.event.name} - ${registration.modality.name}`,
          description: `Inscrição #${registration.registrationNumber}`,
          category_id: 'tickets',
          quantity: 1,
          unit_price: total,
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
      binary_mode: false,
      expires: false,
    };

    // Adicionar marketplace_fee se habilitado
    if (enableSplitPayments) {
      preferenceData.marketplace_fee = platformFee;
    }

    // Criar preferência
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferenceData),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { raw: responseText };
      }

      const errorMessage = errorData.message || errorData.error || 'Erro desconhecido';
      const errorMessageLower = errorMessage.toLowerCase();

      // Erro específico: "Uma das partes é de teste"
      if (
        errorMessageLower.includes('teste') ||
        errorMessageLower.includes('test') ||
        errorMessageLower.includes('partes')
      ) {
        return NextResponse.json(
          {
            error: 'Erro: Uma das partes envolvidas no pagamento é de teste',
            details: 'O Mercado Pago não permite split payments quando a aplicação usa token de teste',
            solution: 'Use MP_TEST_SELLER_TOKEN (token da conta3 - Vendedor) ou conecte via OAuth',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'Erro ao criar checkout no Mercado Pago',
          details: errorMessage,
          mpError: errorData,
        },
        { status: 500 }
      );
    }

    // ============================================
    // 5. PROCESSAR RESPOSTA E RETORNAR URL
    // ============================================
    const preference = JSON.parse(responseText);

    // Usar sandbox_init_point em ambiente de teste
    const checkoutUrl = isTestMode && preference.sandbox_init_point
      ? preference.sandbox_init_point
      : preference.init_point;

    return NextResponse.json({
      checkoutUrl,
      preferenceId: preference.id,
      marketplaceFee: preference.marketplace_fee || null,
      testMode: isTestMode,
    });
  } catch (error) {
    console.error('❌ Erro ao criar preferência:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao criar checkout',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
