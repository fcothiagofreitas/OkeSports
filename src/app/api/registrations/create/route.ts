import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';
import { calculatePrice } from '@/lib/pricing';

// Schema de validação
const createRegistrationSchema = z.object({
  eventId: z.string().cuid(),
  modalityId: z.string().cuid(),
  couponCode: z.string().optional(),
  shirtSize: z.enum(['PP', 'P', 'M', 'G', 'GG', 'XG']).optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  medicalInfo: z.string().optional(),
  teamName: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'Você deve aceitar os termos de uso',
  }),
  dataPrivacyAccepted: z.boolean().refine((val) => val === true, {
    message: 'Você deve aceitar a política de privacidade',
  }),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação do participante
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const participantId = decoded.userId;

    // 2. Validar dados da requisição
    const body = await request.json();
    const validatedData = createRegistrationSchema.parse(body);

    // 3. Buscar evento e modalidade
    const event = await prisma.event.findUnique({
      where: { id: validatedData.eventId },
      include: {
        modalities: {
          where: { id: validatedData.modalityId, active: true },
        },
        organizer: {
          select: {
            id: true,
            mpConnected: true,
            mpUserId: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    if (event.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Evento não está disponível para inscrições' },
        { status: 400 }
      );
    }

    // 4. Verificar organizador tem Mercado Pago conectado
    if (!event.organizer.mpConnected) {
      return NextResponse.json(
        { error: 'Organizador ainda não configurou pagamentos' },
        { status: 400 }
      );
    }

    // 5. Verificar modalidade existe
    const modality = event.modalities[0];
    if (!modality) {
      return NextResponse.json(
        { error: 'Modalidade não encontrada ou inativa' },
        { status: 404 }
      );
    }

    // 6. Verificar período de inscrições
    const now = new Date();
    if (now < event.registrationStart) {
      return NextResponse.json(
        { error: 'As inscrições ainda não foram abertas' },
        { status: 400 }
      );
    }

    if (now > event.registrationEnd) {
      return NextResponse.json(
        { error: 'As inscrições já foram encerradas' },
        { status: 400 }
      );
    }

    // 7. Verificar vagas disponíveis
    if (modality.maxSlots) {
      const registeredCount = await prisma.registration.count({
        where: {
          modalityId: modality.id,
          status: { in: ['CONFIRMED', 'PENDING'] },
        },
      });

      if (registeredCount >= modality.maxSlots) {
        return NextResponse.json(
          { error: 'Não há mais vagas disponíveis nesta modalidade' },
          { status: 400 }
        );
      }
    }

    // 8. Verificar se participante já está inscrito
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        participantId,
        eventId: event.id,
        modalityId: modality.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Você já possui uma inscrição para esta modalidade' },
        { status: 400 }
      );
    }

    // 9. Calcular valores usando calculatePrice (aplica lote e cupom automaticamente)
    const pricing = await calculatePrice(
      validatedData.eventId,
      validatedData.modalityId,
      validatedData.couponCode
    );

    // 10. Buscar cupom se fornecido e válido
    let couponId: string | undefined;
    if (pricing.couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          eventId: validatedData.eventId,
          code: pricing.couponCode,
        },
      });
      couponId = coupon?.id;
    }

    // 10.5. Validar e reservar estoque do kit
    const kit = await prisma.kit.findUnique({
      where: { eventId: validatedData.eventId },
      include: {
        sizes: true,
      },
    });

    if (kit) {
      // Verificar se tamanho é obrigatório (deve ser feito ANTES de verificar se foi fornecido)
      if (kit.shirtRequired && !validatedData.shirtSize) {
        return NextResponse.json(
          { error: 'Tamanho da camiseta é obrigatório para este evento' },
          { status: 400 }
        );
      }

      // Se tamanho foi informado, validar e reservar estoque
      if (validatedData.shirtSize) {
        // Buscar estoque do tamanho
        const sizeStock = kit.sizes.find((s) => s.size === validatedData.shirtSize);

        if (!sizeStock) {
          return NextResponse.json(
            { error: `Tamanho ${validatedData.shirtSize} não está disponível para este evento` },
            { status: 400 }
          );
        }

        // Calcular disponível
        const available = sizeStock.stock - sizeStock.reserved - sizeStock.sold;

        if (available <= 0) {
          return NextResponse.json(
            { error: `Tamanho ${validatedData.shirtSize} está esgotado` },
            { status: 400 }
          );
        }

        // Reservar estoque (incrementar reserved)
        await prisma.kitSizeStock.update({
          where: { id: sizeStock.id },
          data: {
            reserved: {
              increment: 1,
            },
          },
        });
      }
    }

    // 11. Buscar último número de inscrição do evento
    const lastRegistration = await prisma.registration.findFirst({
      where: { eventId: event.id },
      orderBy: { registrationNumber: 'desc' },
      select: { registrationNumber: true },
    });

    const registrationNumber = (lastRegistration?.registrationNumber || 0) + 1;

    // 12. Criar inscrição
    const registration = await prisma.registration.create({
      data: {
        eventId: event.id,
        modalityId: modality.id,
        participantId,
        buyerId: participantId,
        couponId,
        registrationNumber,
        basePrice: pricing.basePrice,
        discount: pricing.batchDiscount + pricing.couponDiscount,
        subtotal: pricing.subtotal,
        platformFee: pricing.platformFee,
        total: pricing.total,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        shirtSize: validatedData.shirtSize,
        emergencyContact: validatedData.emergencyContact,
        emergencyPhone: validatedData.emergencyPhone,
        medicalInfo: validatedData.medicalInfo,
        teamName: validatedData.teamName,
        termsAccepted: validatedData.termsAccepted,
        dataPrivacyAccepted: validatedData.dataPrivacyAccepted,
      },
      include: {
        event: {
          select: {
            name: true,
            slug: true,
          },
        },
        modality: {
          select: {
            name: true,
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

    // 13. Retornar dados da inscrição
    return NextResponse.json(
      {
        registration: {
          id: registration.id,
          registrationNumber: registration.registrationNumber,
          eventName: registration.event.name,
          eventSlug: registration.event.slug,
          modalityName: registration.modality.name,
          total: registration.total,
          status: registration.status,
        },
        organizerId: event.organizer.id,
        mpUserId: event.organizer.mpUserId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating registration:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : error);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao criar inscrição',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
