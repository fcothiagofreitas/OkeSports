import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { checkoutSchema } from '@/lib/validations/checkout';
import { calculatePrice } from '@/lib/pricing';
import { ZodError } from 'zod';
import type { CheckoutResponse } from '@/types/checkout';

// ============================================
// POST /api/checkout
// ============================================
// Cria inscrição(ões) e gera pagamento PIX

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados
    const validatedData = checkoutSchema.parse(body);

    const { eventId, modalityId, participants, couponCode, paymentMethod } = validatedData;

    // 1. Verificar se evento está aberto para inscrições
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        status: true,
        registrationStart: true,
        registrationEnd: true,
        organizerId: true,
        organizer: {
          select: {
            mpConnected: true,
            mpAccessToken: true,
            mpUserId: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    if (event.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Evento não está publicado' }, { status: 400 });
    }

    const now = new Date();
    if (now < event.registrationStart || now > event.registrationEnd) {
      return NextResponse.json(
        { error: 'Inscrições fechadas para este evento' },
        { status: 400 }
      );
    }

    // Verificar se organizador tem MP conectado
    if (!event.organizer.mpConnected) {
      return NextResponse.json(
        { error: 'Organizador ainda não configurou pagamentos' },
        { status: 400 }
      );
    }

    // 2. Verificar modalidade
    const modality = await prisma.modality.findUnique({
      where: { id: modalityId },
      select: { id: true, name: true, active: true, maxSlots: true, soldSlots: true },
    });

    if (!modality || !modality.active) {
      return NextResponse.json({ error: 'Modalidade inválida ou inativa' }, { status: 400 });
    }

    // Verificar vagas disponíveis
    if (modality.maxSlots) {
      const slotsAvailable = modality.maxSlots - modality.soldSlots;
      if (participants.length > slotsAvailable) {
        return NextResponse.json(
          { error: `Apenas ${slotsAvailable} vaga(s) disponível(is)` },
          { status: 400 }
        );
      }
    }

    // 3. Calcular preço por participante
    const pricing = await calculatePrice(eventId, modalityId, couponCode);

    // Preço total (múltiplos participantes)
    const totalAmount = pricing.total * participants.length;

    // 4. Buscar cupom (se fornecido e válido)
    let couponId: string | undefined;
    if (pricing.couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: { eventId, code: pricing.couponCode },
      });
      couponId = coupon?.id;
    }

    // 5. Criar ou buscar participantes
    const participantRecords = await Promise.all(
      participants.map(async (p) => {
        // Verificar se participante já existe
        let participant = await prisma.participant.findUnique({
          where: { cpf: p.cpf },
        });

        if (!participant) {
          // Criar novo participante
          participant = await prisma.participant.create({
            data: {
              email: p.email,
              fullName: p.fullName,
              cpf: p.cpf,
              phone: p.phone,
              birthDate: new Date(p.birthDate),
              gender: p.gender || 'NOT_INFORMED',
            },
          });
        }

        return participant;
      })
    );

    // 6. Gerar número de inscrição sequencial
    const lastRegistration = await prisma.registration.findFirst({
      where: { eventId },
      orderBy: { registrationNumber: 'desc' },
      select: { registrationNumber: true },
    });

    let registrationNumber = (lastRegistration?.registrationNumber || 0) + 1;

    // 7. Criar inscrições (uma para cada participante)
    const registrations = await Promise.all(
      participantRecords.map(async (participant) => {
        const registration = await prisma.registration.create({
          data: {
            eventId,
            modalityId,
            participantId: participant.id,
            buyerId: participantRecords[0].id, // Primeiro participante é o comprador
            couponId,
            basePrice: pricing.basePrice,
            discount: pricing.batchDiscount + pricing.couponDiscount,
            subtotal: pricing.subtotal,
            platformFee: pricing.platformFee,
            total: pricing.total,
            registrationNumber: registrationNumber++,
            paymentStatus: 'PENDING',
            status: 'PENDING',
          },
        });

        return registration;
      })
    );

    // 8. Criar pagamento PIX no Mercado Pago (MOCK por enquanto)
    // TODO: Implementar integração real com MP quando tiver credenciais

    const mockPaymentId = `mock_${Date.now()}`;
    const mockQrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 pixel
    const mockQrCodeText = '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-42665544000052040000530398654041.005802BR5925NOME DO RECEBEDOR6014CIDADE123456789';

    // Atualizar primeira inscrição com dados do pagamento
    await prisma.registration.update({
      where: { id: registrations[0].id },
      data: {
        paymentId: mockPaymentId,
        paymentMethod: 'pix',
      },
    });

    // 9. Retornar resposta
    const response: CheckoutResponse = {
      registrationId: registrations[0].id,
      registrationNumber: registrations[0].registrationNumber,
      paymentId: mockPaymentId,
      paymentStatus: 'PENDING',
      qrCode: mockQrCode,
      qrCodeText: mockQrCodeText,
      pricing: {
        ...pricing,
        total: totalAmount, // Total considerando todos os participantes
      },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Erro ao processar checkout' }, { status: 500 });
  }
}
