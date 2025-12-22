import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware/auth';

// ============================================
// GET /api/dashboard/stats
// ============================================
// Retorna estatísticas gerais do organizador
// Requer autenticação

async function getDashboardStats(request: NextRequest & { user: { userId: string } }) {
  try {
    const { userId } = request.user;

    console.log('📊 Buscando estatísticas para userId:', userId);

    // Buscar eventos do organizador
    let events;
    try {
      events = await prisma.event.findMany({
        where: { organizerId: userId },
        select: {
          id: true,
          name: true,
          status: true,
          eventDate: true,
          _count: {
            select: {
              registrations: true,
              modalities: true,
            },
          },
        },
      });
      console.log('✅ Eventos encontrados:', events.length);
    } catch (error) {
      console.error('❌ Erro ao buscar eventos:', error);
      throw error;
    }

    // Buscar todas as inscrições dos eventos do organizador
    const eventIds = events.map((e) => e.id);
    
    // Se não há eventos, retornar estatísticas zeradas
    let registrations: Array<{
      status: string;
      paymentStatus: string;
      subtotal: any;
      mercadoPagoFee: any;
      createdAt: Date;
    }> = [];
    
    if (eventIds.length > 0) {
      try {
        registrations = await prisma.registration.findMany({
          where: {
            eventId: { in: eventIds },
          },
          select: {
            status: true,
            paymentStatus: true,
            subtotal: true,
            mercadoPagoFee: true,
            createdAt: true,
          },
        });
        console.log('✅ Inscrições encontradas:', registrations.length);
      } catch (error) {
        console.error('❌ Erro ao buscar inscrições:', error);
        throw error;
      }
    } else {
      console.log('ℹ️ Nenhum evento encontrado, retornando estatísticas zeradas');
    }

    // Calcular estatísticas
    const totalEvents = events.length;
    const activeEvents = events.filter((e) => e.status === 'PUBLISHED').length;
    const draftEvents = events.filter((e) => e.status === 'DRAFT').length;

    const totalRegistrations = registrations.length;
    const confirmedRegistrations = registrations.filter((r) => r.status === 'CONFIRMED').length;
    const pendingRegistrations = registrations.filter((r) => r.status === 'PENDING').length;
    const cancelledRegistrations = registrations.filter((r) => r.status === 'CANCELLED').length;

    // Calcular receitas (apenas pagamentos aprovados)
    const approvedRegistrations = registrations.filter((r) => r.paymentStatus === 'APPROVED');
    
    // Total bruto = soma dos subtotais (valor das inscrições sem taxa Okê)
    const totalRevenue = approvedRegistrations.reduce((sum, r) => {
      try {
        // Prisma Decimal precisa ser convertido corretamente
        const subtotal = r.subtotal 
          ? (typeof r.subtotal === 'object' && 'toNumber' in r.subtotal 
              ? r.subtotal.toNumber() 
              : Number(r.subtotal))
          : 0;
        return sum + (isNaN(subtotal) ? 0 : subtotal);
      } catch (e) {
        console.warn('Erro ao converter subtotal:', r.subtotal, e);
        return sum;
      }
    }, 0);
    
    // Total de taxas do Mercado Pago
    const totalMercadoPagoFee = approvedRegistrations.reduce((sum, r) => {
      try {
        const fee = r.mercadoPagoFee
          ? (typeof r.mercadoPagoFee === 'object' && 'toNumber' in r.mercadoPagoFee
              ? r.mercadoPagoFee.toNumber()
              : Number(r.mercadoPagoFee))
          : 0;
        return sum + (isNaN(fee) ? 0 : fee);
      } catch (e) {
        console.warn('Erro ao converter mercadoPagoFee:', r.mercadoPagoFee, e);
        return sum;
      }
    }, 0);
    
    // Receita líquida = subtotal - taxa MP (o que o organizador realmente recebe)
    const netRevenue = totalRevenue - totalMercadoPagoFee;

    // Inscrições dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRegistrations = registrations.filter(
      (r) => new Date(r.createdAt) >= sevenDaysAgo
    ).length;

    // Próximo evento (mais próximo)
    const upcomingEvent = events
      .filter((e) => e.eventDate && new Date(e.eventDate) >= new Date())
      .sort((a, b) => {
        if (!a.eventDate || !b.eventDate) return 0;
        return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      })[0];

    // Alertas
    const alerts: Array<{
      type: 'warning' | 'info' | 'success' | 'error';
      message: string;
      action?: { label: string; href: string };
    }> = [];

    // Verificar eventos próximos (7 dias)
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcomingEvents = events.filter((e) => {
      if (!e.eventDate) return false;
      const eventDate = new Date(e.eventDate);
      return eventDate >= now && eventDate <= sevenDaysFromNow;
    });

    if (upcomingEvents.length > 0) {
      alerts.push({
        type: 'info',
        message: `${upcomingEvents.length} evento${upcomingEvents.length > 1 ? 's' : ''} próximo${upcomingEvents.length > 1 ? 's' : ''} em 7 dias`,
        action: { label: 'Ver eventos', href: '/app/events' },
      });
    }

    // Verificar inscrições pendentes há mais de 24h
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    const oldPendingRegistrations = registrations.filter(
      (r) => r.status === 'PENDING' && new Date(r.createdAt) < oneDayAgo
    ).length;

    if (oldPendingRegistrations > 0) {
      alerts.push({
        type: 'warning',
        message: `${oldPendingRegistrations} inscrição${oldPendingRegistrations > 1 ? 'ões' : ''} pendente${oldPendingRegistrations > 1 ? 's' : ''} há mais de 24h`,
      });
    }

    // Verificar eventos sem modalidades
    const eventsWithoutModalities = events.filter((e) => e._count.modalities === 0);

    if (eventsWithoutModalities.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${eventsWithoutModalities.length} evento${eventsWithoutModalities.length > 1 ? 's' : ''} sem modalidades cadastradas`,
        action: { label: 'Adicionar modalidades', href: '/app/events' },
      });
    }

    const response = {
      events: {
        total: totalEvents,
        active: activeEvents,
        draft: draftEvents,
      },
      registrations: {
        total: totalRegistrations,
        confirmed: confirmedRegistrations,
        pending: pendingRegistrations,
        cancelled: cancelledRegistrations,
        recent: recentRegistrations, // Últimos 7 dias
      },
      revenue: {
        total: totalRevenue, // Receita bruta (total pago pelos competidores)
        mercadoPagoFee: totalMercadoPagoFee, // Taxa do gateway (paga pelo organizador)
        net: netRevenue, // Receita líquida (o que o organizador realmente recebe)
      },
      upcomingEvent: upcomingEvent && upcomingEvent.eventDate
        ? {
            id: upcomingEvent.id,
            name: upcomingEvent.name,
            eventDate: upcomingEvent.eventDate,
            registrations: upcomingEvent._count.registrations,
          }
        : null,
      alerts,
    };

    console.log('✅ Estatísticas calculadas com sucesso');
    console.log('📊 Resumo:', {
      eventos: totalEvents,
      inscricoes: totalRegistrations,
      receitaBruta: totalRevenue,
      receitaLiquida: netRevenue,
    });

    return NextResponse.json(response);
  } catch (error) {
    // Log completo do erro
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('❌ Get dashboard stats error:', errorMessage);
    console.error('Stack:', errorStack);
    
    // Tentar serializar o erro (pode falhar se tiver propriedades não serializáveis)
    try {
      console.error('Error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch (e) {
      console.error('Could not serialize error:', e);
    }
    
    return NextResponse.json(
      {
        error: 'Erro ao buscar estatísticas',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getDashboardStats);

