import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import prisma from '@/lib/db';
import { decryptOAuthTokens } from '@/lib/mercadopago';

/**
 * Verifica e atualiza pagamentos pendentes no Mercado Pago
 * Útil quando o pagamento foi aprovado mas o webhook não atualizou
 */
async function checkPendingPayments(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const registrationId = searchParams.get('registrationId');

    // Buscar inscrições pendentes (com ou sem paymentId)
    // Incluímos sem paymentId porque pode ter sido criada mas o webhook não salvou o paymentId
    const where: any = {
      status: 'PENDING',
    };

    if (eventId) {
      where.eventId = eventId;
    }

    if (registrationId) {
      where.id = registrationId;
    }

    // Filtro opcional: apenas inscrições criadas nas últimas X horas
    const hoursAgo = searchParams.get('hoursAgo');
    if (hoursAgo) {
      const hours = parseInt(hoursAgo, 10);
      if (!isNaN(hours) && hours > 0) {
        const dateLimit = new Date();
        dateLimit.setHours(dateLimit.getHours() - hours);
        where.createdAt = {
          gte: dateLimit,
        };
      }
    }

    const pendingRegistrations = await prisma.registration.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });

    if (pendingRegistrations.length === 0) {
      return NextResponse.json({
        message: 'Nenhuma inscrição pendente encontrada',
        checked: 0,
        updated: 0,
      });
    }

    let checked = 0;
    let updated = 0;
    const results: any[] = [];

    for (const registration of pendingRegistrations) {
      checked++;

      if (!registration.event.organizer.mpAccessToken) {
        results.push({
          registrationId: registration.id,
          registrationNumber: registration.registrationNumber,
          status: 'error',
          message: 'Organizador não tem token OAuth configurado',
        });
        continue;
      }

      try {
        // Descriptografar token
        const { accessToken: mpAccessToken } = decryptOAuthTokens({
          encryptedAccessToken: registration.event.organizer.mpAccessToken,
          encryptedRefreshToken: '',
        });

        let payment: any = null;
        let paymentResponse: Response | null = null;

        // Estratégia 1: Se tem paymentId, buscar diretamente
        if (registration.paymentId) {
          paymentResponse = await fetch(
            `https://api.mercadopago.com/v1/payments/${registration.paymentId}`,
            {
              headers: { Authorization: `Bearer ${mpAccessToken}` },
            }
          );

          if (paymentResponse.ok) {
            payment = await paymentResponse.json();
          }
        }

        // Estratégia 2: Se não encontrou ou não tem paymentId, buscar por external_reference
        // O external_reference é o registrationId
        // A API de search do MP permite buscar por external_reference usando qs (query string)
        if (!payment) {
          try {
            // Buscar pagamentos usando a API de search do MP
            // Usamos qs para buscar por external_reference
            const searchUrl = new URL('https://api.mercadopago.com/v1/payments/search');
            // A API aceita external_reference como parâmetro de busca
            searchUrl.searchParams.set('external_reference', registration.id);
            searchUrl.searchParams.set('sort', 'date_created');
            searchUrl.searchParams.set('criteria', 'desc');
            searchUrl.searchParams.set('limit', '50'); // Aumentar limite para garantir que encontre

            const searchResponse = await fetch(searchUrl.toString(), {
              headers: { Authorization: `Bearer ${mpAccessToken}` },
            });

            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              if (searchData.results && searchData.results.length > 0) {
                // Encontrar o pagamento com external_reference correto
                // Pode haver múltiplos resultados, pegar o mais recente aprovado
                const matchingPayments = searchData.results.filter(
                  (p: any) => p.external_reference === registration.id
                );
                
                if (matchingPayments.length > 0) {
                  // Priorizar pagamentos aprovados
                  const approvedPayment = matchingPayments.find((p: any) => p.status === 'approved');
                  payment = approvedPayment || matchingPayments[0];
                  
                  // Salvar o paymentId se não estava salvo
                  if (!registration.paymentId) {
                    await prisma.registration.update({
                      where: { id: registration.id },
                      data: { paymentId: payment.id.toString() },
                    });
                    console.log(`✅ paymentId salvo para inscrição ${registration.id}: ${payment.id}`);
                  }
                }
              }
            } else {
              const errorText = await searchResponse.text();
              console.warn(`⚠️ Erro ao buscar por external_reference (${registration.id}): ${errorText}`);
            }
          } catch (searchError) {
            console.warn(`⚠️ Erro ao buscar pagamento por external_reference para ${registration.id}:`, searchError);
          }
        }

        if (!payment) {
          results.push({
            registrationId: registration.id,
            registrationNumber: registration.registrationNumber,
            status: 'not_found',
            message: registration.paymentId
              ? 'Pagamento não encontrado no Mercado Pago'
              : 'Nenhum pagamento encontrado para esta inscrição',
          });
          continue;
        }

        const paymentStatus = payment.status;

        // Se foi aprovado no MP mas ainda está pendente no sistema
        if (paymentStatus === 'approved' && registration.status === 'PENDING') {
          // Calcular taxa do Mercado Pago
          let mercadoPagoFee: number | null = null;
          const transactionDetails = payment.transaction_details;
          const transactionAmount = payment.transaction_amount;
          const marketplaceFee = payment.marketplace_fee || Number(registration.platformFee) || 0;

          if (transactionDetails) {
            const netReceived = transactionDetails.net_received_amount;

            // Método 1: fee_details
            if (transactionDetails.fee_details && Array.isArray(transactionDetails.fee_details)) {
              const totalFees = transactionDetails.fee_details.reduce(
                (sum: number, fee: any) => sum + (Number(fee.amount) || 0),
                0
              );
              if (totalFees > 0) {
                mercadoPagoFee = totalFees;
              }
            }

            // Método 2: Calcular usando net_received_amount
            if (mercadoPagoFee === null && netReceived !== undefined && transactionAmount) {
              mercadoPagoFee = transactionAmount - netReceived - marketplaceFee;
              if (mercadoPagoFee <= 0) {
                mercadoPagoFee = null;
              }
            }
          }

          // Atualizar inscrição
          await prisma.registration.update({
            where: { id: registration.id },
            data: {
              paymentStatus: 'APPROVED',
              status: 'CONFIRMED',
              paymentMethod: payment.payment_type_id,
              mercadoPagoFee: mercadoPagoFee,
              confirmedAt: new Date(),
            },
          });

          updated++;
          results.push({
            registrationId: registration.id,
            registrationNumber: registration.registrationNumber,
            status: 'updated',
            message: 'Status atualizado para CONFIRMED',
            paymentStatus: paymentStatus,
          });
        } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
          await prisma.registration.update({
            where: { id: registration.id },
            data: {
              paymentStatus: paymentStatus === 'rejected' ? 'REJECTED' : 'CANCELLED',
              status: 'CANCELLED',
            },
          });

          updated++;
          results.push({
            registrationId: registration.id,
            registrationNumber: registration.registrationNumber,
            status: 'updated',
            message: 'Status atualizado para CANCELLED',
            paymentStatus: paymentStatus,
          });
        } else {
          results.push({
            registrationId: registration.id,
            registrationNumber: registration.registrationNumber,
            status: 'pending',
            message: `Pagamento ainda em processamento (${paymentStatus})`,
            paymentStatus: paymentStatus,
          });
        }
      } catch (error) {
        results.push({
          registrationId: registration.id,
          registrationNumber: registration.registrationNumber,
          status: 'error',
          message: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    return NextResponse.json({
      message: `Verificação concluída: ${checked} verificado(s), ${updated} atualizado(s)`,
      checked,
      updated,
      results,
    });
  } catch (error) {
    console.error('Erro ao verificar pagamentos pendentes:', error);
    return NextResponse.json(
      {
        error: 'Erro ao verificar pagamentos pendentes',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(checkPendingPayments);

