import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
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

    // Obter parâmetros da query
    const searchParams = request.nextUrl.searchParams;
    const registrationId = searchParams.get('registrationId');

    if (!registrationId) {
      return NextResponse.json(
        { error: 'registrationId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar a inscrição de referência
    const referenceRegistration = await prisma.registration.findUnique({
      where: { id: registrationId },
      select: {
        id: true,
        paymentId: true,
        buyerId: true,
        createdAt: true,
        eventId: true,
      },
    });

    if (!referenceRegistration) {
      return NextResponse.json(
        { error: 'Inscrição não encontrada' },
        { status: 404 }
      );
    }

    // Determinar a chave do grupo (mesma lógica de groupRegistrations)
    let groupKey: string;
    
    if (referenceRegistration.paymentId) {
      // Extrair prefixo do paymentId (tudo exceto a última parte que é o reg.id)
      const parts = referenceRegistration.paymentId.split('_');
      const paymentPrefix = parts.slice(0, -1).join('_');
      groupKey = `payment_${paymentPrefix}`;
    } else {
      // Agrupar por buyerId + createdAt (tolerância de 1 minuto)
      const createdAtDate = new Date(referenceRegistration.createdAt);
      const roundedDate = new Date(createdAtDate);
      roundedDate.setSeconds(0, 0);
      roundedDate.setMilliseconds(0);
      
      const buyerId = referenceRegistration.buyerId || referenceRegistration.id; // fallback
      groupKey = `order_${buyerId}_${roundedDate.toISOString()}`;
    }

    // Buscar todas as inscrições do mesmo grupo
    let groupRegistrations;

    if (referenceRegistration.paymentId) {
      // Buscar por prefixo do paymentId
      // O paymentId pode ter formato: "prefixo_regId" ou apenas um ID único
      const parts = referenceRegistration.paymentId.split('_');
      
      // Se tem mais de uma parte (formato "prefixo_regId"), buscar por prefixo
      if (parts.length > 1) {
        const paymentPrefix = parts.slice(0, -1).join('_');
        
        // Buscar todas as inscrições que começam com o mesmo prefixo
        groupRegistrations = await prisma.registration.findMany({
          where: {
            paymentId: {
              startsWith: paymentPrefix + '_',
            },
            eventId: referenceRegistration.eventId,
          },
        include: {
          participant: {
            select: {
              id: true,
              fullName: true,
              cpf: true,
              email: true,
              phone: true,
            },
          },
          modality: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              eventDate: true,
            },
          },
        },
        orderBy: {
          registrationNumber: 'asc',
        },
      });
      } else {
        // Se paymentId não tem formato de prefixo, usar buyerId + createdAt
        // (paymentId único, não agrupado)
        if (!referenceRegistration.buyerId) {
          // Se não há buyerId, retornar apenas esta inscrição
          const singleRegistration = await prisma.registration.findUnique({
            where: { id: registrationId },
            include: {
              participant: {
                select: {
                  id: true,
                  fullName: true,
                  cpf: true,
                  email: true,
                  phone: true,
                },
              },
              modality: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
              event: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  eventDate: true,
                },
              },
            },
          });

          if (!singleRegistration) {
            return NextResponse.json(
              { error: 'Inscrição não encontrada' },
              { status: 404 }
            );
          }

          groupRegistrations = [singleRegistration];
        } else {
          // Usar buyerId + createdAt
          const createdAtDate = new Date(referenceRegistration.createdAt);
          const startTime = new Date(createdAtDate);
          startTime.setSeconds(0, 0);
          startTime.setMilliseconds(0);
          
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + 1);
          
          groupRegistrations = await prisma.registration.findMany({
            where: {
              buyerId: referenceRegistration.buyerId,
              eventId: referenceRegistration.eventId,
              createdAt: {
                gte: startTime,
                lt: endTime,
              },
            },
            include: {
              participant: {
                select: {
                  id: true,
                  fullName: true,
                  cpf: true,
                  email: true,
                  phone: true,
                },
              },
              modality: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
              event: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  eventDate: true,
                },
              },
            },
            orderBy: {
              registrationNumber: 'asc',
            },
          });
        }
      }
    } else {
      // Buscar por buyerId + createdAt (tolerância de 1 minuto)
      // Se não há buyerId, usar participantId como fallback
      if (!referenceRegistration.buyerId) {
        return NextResponse.json(
          { error: 'Inscrição não possui informações de grupo' },
          { status: 400 }
        );
      }

      const createdAtDate = new Date(referenceRegistration.createdAt);
      const startTime = new Date(createdAtDate);
      startTime.setSeconds(0, 0);
      startTime.setMilliseconds(0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 1);
      
      groupRegistrations = await prisma.registration.findMany({
        where: {
          buyerId: referenceRegistration.buyerId,
          eventId: referenceRegistration.eventId,
          createdAt: {
            gte: startTime,
            lt: endTime,
          },
        },
        include: {
          participant: {
            select: {
              id: true,
              fullName: true,
              cpf: true,
              email: true,
              phone: true,
            },
          },
          modality: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              eventDate: true,
            },
          },
        },
        orderBy: {
          registrationNumber: 'asc',
        },
      });
    }

    // Verificar se o usuário tem permissão para ver essas inscrições
    // (deve ser o comprador ou um dos participantes)
    const isBuyer = groupRegistrations.some(r => r.buyerId === participantId);
    const isParticipant = groupRegistrations.some(r => r.participantId === participantId);

    if (!isBuyer && !isParticipant) {
      return NextResponse.json(
        { error: 'Você não tem permissão para ver essas inscrições' },
        { status: 403 }
      );
    }

    // Calcular total do grupo
    const total = groupRegistrations.reduce((sum, reg) => sum + Number(reg.total), 0);
    const subtotal = groupRegistrations.reduce((sum, reg) => sum + Number(reg.subtotal), 0);
    const platformFee = groupRegistrations.reduce((sum, reg) => sum + Number(reg.platformFee), 0);

    return NextResponse.json({
      registrations: groupRegistrations.map((reg) => ({
        id: reg.id,
        registrationNumber: reg.registrationNumber,
        status: reg.status,
        paymentStatus: reg.paymentStatus,
        basePrice: Number(reg.basePrice),
        discount: Number(reg.discount),
        subtotal: Number(reg.subtotal),
        platformFee: Number(reg.platformFee),
        total: Number(reg.total),
        shirtSize: reg.shirtSize,
        createdAt: reg.createdAt,
        participant: reg.participant,
        modality: reg.modality,
        event: reg.event,
      })),
      total,
      subtotal,
      platformFee,
      paymentId: referenceRegistration.paymentId,
      paymentStatus: groupRegistrations[0]?.paymentStatus || 'PENDING',
      status: groupRegistrations[0]?.status || 'PENDING',
    });
  } catch (error) {
    console.error('Error fetching registration group:', error);
    return NextResponse.json(
      {
        error: 'Erro ao buscar grupo de inscrições',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
