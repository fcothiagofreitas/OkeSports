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

    console.log('[CHECKOUT] Recebido:', {
      participantsCount: body.participants?.length,
      eventId: body.eventId,
      modalityId: body.modalityId,
    });

    // Validar dados
    const validatedData = checkoutSchema.parse(body);

    const { eventId, modalityId, participants, couponCode, paymentMethod } = validatedData;

    console.log('[CHECKOUT] Validado:', {
      participantsCount: participants.length,
      participants: participants.map((p) => ({ name: p.fullName, cpf: p.cpf })),
    });

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

    // 5. Verificar se algum participante já tem inscrição ativa para este evento/modalidade
    // Em desenvolvimento, permitir inscrições repetidas para testes
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment) {
      console.log('[CHECKOUT] Verificando inscrições ativas existentes...');
      for (const p of participants) {
        const existingParticipant = await prisma.participant.findUnique({
          where: { cpf: p.cpf },
        });

        if (existingParticipant) {
          const activeRegistration = await prisma.registration.findFirst({
            where: {
              participantId: existingParticipant.id,
              eventId,
              modalityId,
              status: {
                in: ['PENDING', 'CONFIRMED'], // Apenas inscrições ativas (ignora CANCELLED)
              },
            },
          });

          if (activeRegistration) {
            console.log(`[CHECKOUT] ❌ Participante ${p.fullName} (CPF: ${p.cpf}) já possui inscrição ativa:`, activeRegistration.id);
            return NextResponse.json(
              {
                error: `${p.fullName} já possui uma inscrição ativa para este evento. Cancele a inscrição anterior para se inscrever novamente.`,
                existingRegistrationId: activeRegistration.id,
              },
              { status: 400 }
            );
          } else {
            console.log(`[CHECKOUT] ✅ Participante ${p.fullName} (CPF: ${p.cpf}) não possui inscrição ativa - pode inscrever`);
          }
        }
      }
    } else {
      console.log('[CHECKOUT] ⚠️ MODO DESENVOLVIMENTO: Validação de inscrição repetida desabilitada (permitindo testes)');
    }

    // 6. Criar ou buscar participantes
    console.log('[CHECKOUT] Criando/buscando participantes...');
    const participantRecords = await Promise.all(
      participants.map(async (p, index) => {
        try {
          // Verificar se participante já existe APENAS por CPF (CPF é único, email não)
          let participant = await prisma.participant.findUnique({
            where: { cpf: p.cpf },
          });

          if (!participant) {
            console.log(`[CHECKOUT] Criando novo participante ${index + 1}:`, {
              nome: p.fullName,
              cpf: p.cpf,
              email: p.email,
            });
            
            // Validar e formatar data de nascimento
            let birthDate: Date;
            try {
              if (typeof p.birthDate === 'string') {
                // Se for string ISO, converter
                birthDate = new Date(p.birthDate);
                if (isNaN(birthDate.getTime())) {
                  throw new Error(`Data de nascimento inválida para participante ${index + 1}: ${p.birthDate}`);
                }
                // Validar que não é data futura
                if (birthDate > new Date()) {
                  throw new Error(`Data de nascimento não pode ser futura para participante ${index + 1}`);
                }
              } else if (p.birthDate instanceof Date) {
                birthDate = p.birthDate;
                if (isNaN(birthDate.getTime())) {
                  throw new Error(`Data de nascimento inválida para participante ${index + 1}`);
                }
              } else {
                throw new Error(`Formato de data inválido para participante ${index + 1}`);
              }
            } catch (error) {
              console.error(`[CHECKOUT] Erro ao processar data de nascimento do participante ${index + 1}:`, error);
              throw new Error(`Data de nascimento inválida para ${p.fullName}: ${error instanceof Error ? error.message : 'Data inválida'}`);
            }
            
            // Verificar se CPF já existe (dupla verificação antes de criar)
            const existingCPF = await prisma.participant.findUnique({
              where: { cpf: p.cpf.replace(/\D/g, '') },
            });
            
            if (existingCPF) {
              console.log(`[CHECKOUT] ⚠️ CPF encontrado durante criação (race condition?):`, {
                cpf: p.cpf,
                participanteExistente: existingCPF.fullName,
                emailExistente: existingCPF.email,
              });
              // Se encontrou por CPF, usar esse participante existente
              participant = existingCPF;
            } else {
              // Criar novo participante (email pode repetir, CPF não)
              try {
                participant = await prisma.participant.create({
                  data: {
                    email: p.email.toLowerCase().trim(),
                    fullName: p.fullName.trim(),
                    cpf: p.cpf.replace(/\D/g, ''), // Garantir que está sem formatação
                    phone: p.phone.replace(/\D/g, ''), // Garantir que está sem formatação
                    birthDate: birthDate,
                    gender: (p.gender || 'NOT_INFORMED') as 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_INFORMED',
                  },
                });
                console.log(`[CHECKOUT] ✅ Participante ${index + 1} criado:`, {
                  id: participant.id,
                  nome: participant.fullName,
                  cpf: participant.cpf,
                  email: participant.email,
                });
              } catch (createError: any) {
                // Tratar erro específico do Prisma
                if (createError.code === 'P2002') {
                  // Unique constraint violation - só pode ser CPF agora (email não é mais unique)
                  const field = createError.meta?.target?.[0] || 'campo';
                  console.error(`[CHECKOUT] ❌ Erro de constraint única no campo ${field}:`, createError.meta);
                  
                  if (field === 'cpf') {
                    // Se deu erro de CPF duplicado, buscar o participante existente
                    const existingByCPF = await prisma.participant.findUnique({
                      where: { cpf: p.cpf.replace(/\D/g, '') },
                    });
                    if (existingByCPF) {
                      console.log(`[CHECKOUT] ✅ Participante encontrado após erro de constraint (race condition):`, existingByCPF.id);
                      participant = existingByCPF;
                    } else {
                      throw new Error(`O CPF ${p.cpf} já está cadastrado. Por favor, verifique os dados ou entre em contato com suporte.`);
                    }
                  } else {
                    throw new Error(`Já existe um cadastro com estes dados (${field}). Por favor, verifique os dados informados.`);
                  }
                } else {
                  throw createError;
                }
              }
            }
          } else {
            console.log(`[CHECKOUT] ✅ Participante ${index + 1} já existe:`, {
              id: participant.id,
              nome: participant.fullName,
              cpf: participant.cpf,
              email: participant.email,
            });
          }

          return participant;
        } catch (error) {
          console.error(`[CHECKOUT] ❌ Erro ao processar participante ${index + 1} (${p.fullName}, CPF: ${p.cpf}):`, error);
          // Re-lançar com mensagem mais clara
          if (error instanceof Error) {
            throw error;
          }
          throw new Error(`Erro ao processar participante ${p.fullName}: ${error}`);
        }
      })
    );
    console.log('[CHECKOUT] ✅ Total de participantes processados:', participantRecords.length);

    // 7. Gerar número de inscrição sequencial
    const lastRegistration = await prisma.registration.findFirst({
      where: { eventId },
      orderBy: { registrationNumber: 'desc' },
      select: { registrationNumber: true },
    });

    let registrationNumber = (lastRegistration?.registrationNumber || 0) + 1;

    // 8. Criar inscrições (uma para cada participante)
    // IMPORTANTE: Se qualquer inscrição falhar, todas precisam ser revertidas
    console.log('[CHECKOUT] Criando inscrições para', participantRecords.length, 'participantes...');
    console.log('[CHECKOUT] Dados dos participantes:', participants.map((p, i) => ({
      index: i + 1,
      name: p.fullName,
      cpf: p.cpf,
      email: p.email,
      birthDate: p.birthDate,
    })));
    
    if (participantRecords.length !== participants.length) {
      throw new Error(`Erro: Número de participantes processados (${participantRecords.length}) não corresponde ao número de participantes enviados (${participants.length})`);
    }
    
    const registrations = [];
    let currentRegistrationNumber = registrationNumber;
    
    try {
      for (let index = 0; index < participantRecords.length; index++) {
        const participant = participantRecords[index];
        const participantData = participants[index];
        
        if (!participant || !participantData) {
          throw new Error(`Erro: Dados do participante ${index + 1} não encontrados`);
        }
        
        console.log(`[CHECKOUT] Criando inscrição ${index + 1}/${participantRecords.length} para participante:`, participant.fullName, 'CPF:', participant.cpf);
        
        try {
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
              registrationNumber: currentRegistrationNumber++,
              paymentStatus: 'PENDING',
              status: 'PENDING',
              // Informações adicionais do participante
              shirtSize: participantData.shirtSize,
              emergencyContact: participantData.emergencyContact,
              emergencyPhone: participantData.emergencyPhone,
              medicalInfo: participantData.medicalInfo,
              teamName: participantData.teamName,
              termsAccepted: true, // Aceito no checkout
              dataPrivacyAccepted: true, // Aceito no checkout
            },
          });

          console.log(`[CHECKOUT] ✅ Inscrição ${index + 1} criada:`, {
            id: registration.id,
            number: registration.registrationNumber,
            participant: participant.fullName,
            cpf: participant.cpf,
          });
          registrations.push(registration);
        } catch (error) {
          console.error(`[CHECKOUT] ❌ Erro ao criar inscrição ${index + 1} para ${participant.fullName}:`, error);
          console.error(`[CHECKOUT] Detalhes do erro:`, {
            participantId: participant.id,
            participantData: {
              name: participantData.fullName,
              cpf: participantData.cpf,
              email: participantData.email,
            },
            errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
            errorStack: error instanceof Error ? error.stack : undefined,
          });
          
          // Reverter todas as inscrições já criadas
          if (registrations.length > 0) {
            console.log(`[CHECKOUT] ⚠️ Revertendo ${registrations.length} inscrição(ões) já criadas...`);
            const deleteResults = await Promise.all(
              registrations.map(async (reg) => {
                try {
                  await prisma.registration.delete({ where: { id: reg.id } });
                  console.log(`[CHECKOUT] ✅ Inscrição ${reg.id} revertida`);
                  return { success: true, id: reg.id };
                } catch (err) {
                  console.error(`[CHECKOUT] ❌ Erro ao reverter inscrição ${reg.id}:`, err);
                  return { success: false, id: reg.id, error: err };
                }
              })
            );
            
            const failedDeletes = deleteResults.filter((r) => !r.success);
            if (failedDeletes.length > 0) {
              console.error(`[CHECKOUT] ⚠️ ATENÇÃO: ${failedDeletes.length} inscrição(ões) não puderam ser revertidas:`, failedDeletes);
            }
          }
          
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          throw new Error(`Erro ao criar inscrição para ${participant.fullName} (CPF: ${participant.cpf}): ${errorMessage}`);
        }
      }
      
      // Validar que todas as inscrições foram criadas
      if (registrations.length !== participantRecords.length) {
        throw new Error(`Erro: Apenas ${registrations.length} de ${participantRecords.length} inscrição(ões) foram criadas. Revertendo todas...`);
      }
    } catch (error) {
      // Se houve erro e ainda há inscrições não revertidas, tentar reverter novamente
      if (registrations.length > 0) {
        console.error(`[CHECKOUT] ⚠️ Erro capturado no loop principal. Tentando reverter ${registrations.length} inscrição(ões) restantes...`);
        await Promise.all(
          registrations.map((reg) =>
            prisma.registration.delete({ where: { id: reg.id } }).catch((err) =>
              console.error(`[CHECKOUT] Erro ao reverter inscrição ${reg.id}:`, err)
            )
          )
        );
      }
      // Re-lançar o erro para ser tratado pelo catch principal
      throw error;
    }
    
    console.log('[CHECKOUT] ✅ Total de inscrições criadas com sucesso:', registrations.length);
    console.log('[CHECKOUT] IDs das inscrições:', registrations.map((r) => r.id));

    // 9. Tentar criar preferência no Mercado Pago
    let checkoutUrl: string | undefined;
    let paymentId: string | undefined;
    
    // Só tentar criar preferência se o organizador tem MP conectado
    if (event.organizer.mpConnected) {
      try {
        // Importar dinamicamente a lógica de criar preferência
        // Usar fetch interno (requer que o servidor esteja rodando)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        const preferenceUrl = `${baseUrl}/api/payments/create-preference`;
        
        console.log('[CHECKOUT] Tentando criar preferência no MP:', preferenceUrl);
        
        const preferenceResponse = await fetch(preferenceUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registrationIds: registrations.map((r) => r.id), // Enviar TODAS as inscrições
          }),
        });

        if (preferenceResponse.ok) {
          const preferenceData = await preferenceResponse.json();
          checkoutUrl = preferenceData.checkoutUrl;
          paymentId = preferenceData.preferenceId;
          console.log('[CHECKOUT] ✅ Preferência criada no Mercado Pago:', { checkoutUrl, preferenceId: paymentId });
          
          // Atualizar todas as inscrições com o paymentId da preferência
          await Promise.all(
            registrations.map((reg) =>
              prisma.registration.update({
                where: { id: reg.id },
                data: {
                  paymentId: `${paymentId}_${reg.id}`, // Preferência ID + inscrição ID
                },
              })
            )
          );
        } else {
          const errorData = await preferenceResponse.json().catch(() => ({ error: 'Erro desconhecido' }));
          console.log('[CHECKOUT] ⚠️ Não foi possível criar preferência no MP (usando fallback):', errorData.error);
          // Continuar com fallback mock
        }
      } catch (error) {
        console.log('[CHECKOUT] ⚠️ Erro ao criar preferência no MP (usando fallback):', error instanceof Error ? error.message : String(error));
        // Continuar com fallback mock
      }
    } else {
      console.log('[CHECKOUT] ⚠️ Organizador não tem MP conectado (usando fallback mock)');
    }

    // Fallback: Se não conseguiu criar no MP, usar mock
    if (!paymentId) {
      const mockPaymentId = `mock_${Date.now()}`;
      paymentId = mockPaymentId;
      const mockQrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 pixel
      const mockQrCodeText = '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-42665544000052040000530398654041.005802BR5925NOME DO RECEBEDOR6014CIDADE123456789';

      // Atualizar todas as inscrições com dados do pagamento mock
      await Promise.all(
        registrations.map((reg) =>
          prisma.registration.update({
            where: { id: reg.id },
            data: {
              paymentId: `${mockPaymentId}_${reg.id}`, // ID único por inscrição
              paymentMethod: 'pix',
            },
          })
        )
      );

      console.log('[CHECKOUT] ✅ Todas as inscrições criadas com sucesso (MOCK):', registrations.map((r) => ({ id: r.id, number: r.registrationNumber })));

      // 10. Validar resposta antes de retornar
      if (registrations.length === 0) {
        throw new Error('Nenhuma inscrição foi criada');
      }
      
      if (registrations.length !== participants.length) {
        console.error('[CHECKOUT] ⚠️ ATENÇÃO: Número de inscrições criadas não corresponde ao número de participantes', {
          esperado: participants.length,
          criado: registrations.length,
        });
      }
      
      // Retornar resposta com dados mock
      const response: CheckoutResponse = {
        registrationId: registrations[0].id,
        registrationIds: registrations.map((r) => r.id),
        registrationNumber: registrations[0].registrationNumber,
        registrationNumbers: registrations.map((r) => r.registrationNumber),
        paymentId: mockPaymentId,
        paymentStatus: 'PENDING',
        qrCode: mockQrCode,
        qrCodeText: mockQrCodeText,
        pricing: {
          ...pricing,
          total: totalAmount,
        },
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };

      console.log('[CHECKOUT] ✅ Resposta enviada (MOCK) com', registrations.length, 'inscrição(ões)');
      return NextResponse.json(response, { status: 201 });
    }

    // Se chegou aqui, criou preferência no MP com sucesso
    console.log('[CHECKOUT] ✅ Todas as inscrições criadas com sucesso (MP):', registrations.map((r) => ({ id: r.id, number: r.registrationNumber })));

    // 10. Validar resposta antes de retornar
    if (registrations.length === 0) {
      throw new Error('Nenhuma inscrição foi criada');
    }
    
    if (registrations.length !== participants.length) {
      console.error('[CHECKOUT] ⚠️ ATENÇÃO: Número de inscrições criadas não corresponde ao número de participantes', {
        esperado: participants.length,
        criado: registrations.length,
      });
    }
    
    // 10. Retornar resposta com checkoutUrl do MP
    const response: CheckoutResponse = {
      registrationId: registrations[0].id,
      registrationIds: registrations.map((r) => r.id),
      registrationNumber: registrations[0].registrationNumber,
      registrationNumbers: registrations.map((r) => r.registrationNumber),
      paymentId: paymentId,
      paymentStatus: 'PENDING',
      checkoutUrl: checkoutUrl,
      pricing: {
        ...pricing,
        total: totalAmount,
      },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    console.log('[CHECKOUT] ✅ Resposta enviada com', registrations.length, 'inscrição(ões):', {
      registrationIds: response.registrationIds,
      registrationNumbers: response.registrationNumbers,
      totalAmount: totalAmount,
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('[CHECKOUT] Erro de validação:', error.issues);
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      console.error('[CHECKOUT] Erro:', error.message, error.stack);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('[CHECKOUT] Erro desconhecido:', error);
    return NextResponse.json({ error: 'Erro ao processar checkout' }, { status: 500 });
  }
}
