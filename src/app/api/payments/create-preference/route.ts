import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { decryptOAuthTokens } from '@/lib/mercadopago';

const createPreferenceSchema = z.object({
  registrationId: z.string().cuid().optional(),
  registrationIds: z.array(z.string().cuid()).optional(),
}).refine(
  (data) => data.registrationId || (data.registrationIds && data.registrationIds.length > 0),
  { message: 'Deve fornecer registrationId ou registrationIds' }
);

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
    const { registrationId, registrationIds } = createPreferenceSchema.parse(body);

    // Normalizar para array de IDs
    const ids = registrationIds || (registrationId ? [registrationId] : []);
    
    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma inscrição fornecida' },
        { status: 400 }
      );
    }

    // ============================================
    // 2. BUSCAR INSCRIÇÕES
    // ============================================
    const registrations = await prisma.registration.findMany({
      where: {
        id: { in: ids },
        status: 'PENDING', // Apenas inscrições pendentes
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
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

    if (registrations.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma inscrição pendente encontrada' },
        { status: 404 }
      );
    }

    if (registrations.length !== ids.length) {
      return NextResponse.json(
        { error: `Apenas ${registrations.length} de ${ids.length} inscrição(ões) encontrada(s)` },
        { status: 400 }
      );
    }

    // Usar a primeira inscrição como referência principal (todas devem ser do mesmo evento/organizador)
    const registration = registrations[0];
    
    // Validar que todas as inscrições são do mesmo evento e organizador
    const sameEvent = registrations.every((r) => r.eventId === registration.eventId);
    const sameOrganizer = registrations.every((r) => r.event.organizer.mpUserId === registration.event.organizer.mpUserId);
    
    if (!sameEvent || !sameOrganizer) {
      return NextResponse.json(
        { error: 'Todas as inscrições devem ser do mesmo evento e organizador' },
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
        // Tokens de teste geralmente começam com 'TEST-' ou contêm 'test'/'sandbox'
        // Tokens de produção começam com 'APP_USR-' e NÃO contêm indicadores de teste
        // IMPORTANTE: Se estamos usando token OAuth do organizador, assumir produção
        // a menos que o token explicitamente indique teste
        isTestMode = 
          accessToken.startsWith('TEST-') ||
          accessToken.toLowerCase().includes('test') ||
          accessToken.toLowerCase().includes('sandbox');
        
        // Se não detectou teste explicitamente, assumir produção
        // (variáveis de teste no .env são apenas para fallback, não afetam token OAuth)
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
    // 4. CALCULAR VALORES TOTAIS (MÚLTIPLAS INSCRIÇÕES)
    // ============================================
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Calcular totais de todas as inscrições
    const totalAmount = registrations.reduce((sum, r) => sum + Number(r.total), 0);
    const totalSubtotal = registrations.reduce((sum, r) => sum + Number(r.subtotal), 0);
    const totalPlatformFee = registrations.reduce((sum, r) => sum + Number(r.platformFee), 0);
    
    // Usar valores da primeira inscrição para referência (todos devem ter os mesmos valores unitários)
    const platformFee = Number(registration.platformFee);
    const total = totalAmount; // Valor total de todas as inscrições
    const subtotal = totalSubtotal;

    // Verificar se deve desabilitar split payments em teste
    const disableSplitInTest = process.env.DISABLE_SPLIT_PAYMENTS_TEST === 'true';
    const enableSplitPayments = supportsSplitPayments && platformFee > 0 && !(isTestMode && disableSplitInTest);

    // Formatar data do evento para exibição
    const eventDate = new Date(registration.event.eventDate);
    const formattedEventDate = eventDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // Título e descrição para múltiplas inscrições
    const itemTitle = registrations.length === 1
      ? `Inscrição: ${registration.event.name} - ${registration.modality.name}`
      : `${registrations.length} Inscrições: ${registration.event.name}`;
    
    const itemDescription = registrations.length === 1
      ? `Inscrição #${registration.registrationNumber} | Evento: ${formattedEventDate} | Participante: ${registration.participant.fullName}`
      : `${registrations.length} inscrição(ões) | Evento: ${formattedEventDate} | Números: ${registrations.map((r) => `#${r.registrationNumber}`).join(', ')}`;

    // Sobrenome do comprador: melhora aprovação e reduz rejeição por antifraude (recomendação MP)
    const fullName = registration.participant.fullName.trim();
    const payerLastName = fullName.includes(' ')
      ? fullName.slice(fullName.lastIndexOf(' ') + 1)
      : fullName;

    const preferenceData: any = {
      items: [
        {
          id: registration.modalityId,
          title: itemTitle,
          description: itemDescription,
          category_id: 'tickets',
          quantity: registrations.length, // Quantidade = número de inscrições
          unit_price: Number(registration.total), // Preço unitário (de uma inscrição)
        },
      ],
      payer: {
        name: registration.participant.fullName,
        last_name: payerLastName, // Ação recomendada MP: melhora aprovação e reduz rejeição por antifraude
        email: registration.participant.email,
      },
      back_urls: {
        success: `${appUrl}/inscricao/sucesso?ids=${ids.join(',')}`,
        failure: `${appUrl}/inscricao/falha?ids=${ids.join(',')}`,
        pending: `${appUrl}/inscricao/pendente?ids=${ids.join(',')}`,
      },
      auto_return: 'approved',
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      // external_reference: OBRIGATÓRIO para conciliação financeira
      // Deve ser um código único que correlaciona payment_id do MP com ID interno do sistema
      // Para múltiplas inscrições, usamos o primeiro ID como referência principal
      // e incluímos todos os IDs no metadata
      external_reference: ids[0],
      statement_descriptor: 'OKESPORTS',
      metadata: {
        registration_id: ids[0], // ID principal (primeira inscrição)
        registration_ids: ids.join(','), // Todos os IDs separados por vírgula
        registration_count: registrations.length.toString(),
        registration_numbers: registrations.map((r) => r.registrationNumber).join(','),
        event_id: registration.eventId,
        event_name: registration.event.name,
        event_date: registration.event.eventDate.toISOString(),
        modality_id: registration.modalityId,
        modality_name: registration.modality.name,
        participant_id: registration.participantId,
        participant_name: registration.participant.fullName,
        participant_email: registration.participant.email,
        subtotal: subtotal.toString(),
        platform_fee: totalPlatformFee.toString(),
        total: total.toString(),
      },
      binary_mode: false,
      expires: false,
      // Configuração de métodos de pagamento
      // Não excluímos nenhum método, permitindo todos (incluindo PIX)
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: null,
      },
    };

    // Adicionar marketplace_fee se habilitado (taxa total de todas as inscrições)
    if (enableSplitPayments) {
      preferenceData.marketplace_fee = totalPlatformFee;
    }

    // VALIDAÇÃO OBRIGATÓRIA: external_reference para conciliação financeira
    // O Mercado Pago exige este campo para correlacionar payment_id com ID interno
    if (!preferenceData.external_reference || typeof preferenceData.external_reference !== 'string') {
      console.error('❌ ERRO CRÍTICO: external_reference inválido ou ausente');
      console.error('   Valor recebido:', preferenceData.external_reference);
      console.error('   Tipo:', typeof preferenceData.external_reference);
      return NextResponse.json(
        { 
          error: 'Erro interno: external_reference inválido',
          details: 'O campo external_reference é obrigatório para conciliação financeira',
        },
        { status: 500 }
      );
    }

    // Validar formato: deve ser string não vazia (CUID válido)
    if (preferenceData.external_reference.trim().length === 0) {
      console.error('❌ ERRO CRÍTICO: external_reference está vazio');
      return NextResponse.json(
        { 
          error: 'Erro interno: external_reference vazio',
          details: 'O campo external_reference não pode estar vazio',
        },
        { status: 500 }
      );
    }

    // Log para debug e auditoria
    console.log('📋 Criando preferência de pagamento:', {
      registrationIds: ids,
      registrationCount: registrations.length,
      external_reference: preferenceData.external_reference,
      registrationNumbers: registrations.map((r) => r.registrationNumber),
      eventName: registration.event.name,
      total: total,
      unitPrice: Number(registration.total),
      quantity: registrations.length,
      hasMarketplaceFee: enableSplitPayments,
      marketplaceFee: totalPlatformFee,
    });

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

    // VALIDAÇÃO CRÍTICA: Verificar se external_reference foi aceito pelo Mercado Pago
    // Este campo é obrigatório para conciliação financeira
    const primaryRegistrationId = ids[0];
    if (!preference.external_reference) {
      console.error('❌ ERRO CRÍTICO: Mercado Pago não retornou external_reference na resposta');
      console.error('   Isso pode causar problemas na conciliação financeira');
      console.error('   Preferência criada:', preference.id);
      console.error('   Registration IDs:', ids);
    } else if (preference.external_reference !== primaryRegistrationId) {
      console.error('❌ ERRO CRÍTICO: external_reference não corresponde na resposta do MP');
      console.error('   Enviado:', primaryRegistrationId);
      console.error('   Retornado:', preference.external_reference);
      console.error('   Isso pode causar problemas na conciliação financeira');
    } else {
      console.log('✅ external_reference confirmado pelo Mercado Pago:', {
        external_reference: preference.external_reference,
        registrationIds: ids,
        registrationCount: registrations.length,
        preferenceId: preference.id,
        status: 'OK - Conciliação financeira habilitada',
      });
    }

    // Usar sandbox_init_point em ambiente de teste
    const checkoutUrl = isTestMode && preference.sandbox_init_point
      ? preference.sandbox_init_point
      : preference.init_point;

    return NextResponse.json({
      checkoutUrl,
      preferenceId: preference.id,
      marketplaceFee: preference.marketplace_fee || null,
      externalReference: preference.external_reference || null,
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
