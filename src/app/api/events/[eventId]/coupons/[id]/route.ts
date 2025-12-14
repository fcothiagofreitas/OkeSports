import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import prisma from '@/lib/db';
import { updateCouponSchema } from '@/lib/validations/coupon';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// ============================================
// GET /api/events/[eventId]/coupons/[id]
// ============================================
// Busca um cupom específico

async function getCoupon(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId, id } = await params;

    // Verificar se evento existe e pertence ao usuário
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar este evento' },
        { status: 403 }
      );
    }

    // Buscar cupom
    const coupon = await prisma.coupon.findFirst({
      where: {
        id,
        eventId,
      },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 });
    }

    return NextResponse.json(coupon);
  } catch (error) {
    console.error('Get coupon error:', error);
    return NextResponse.json({ error: 'Erro ao buscar cupom' }, { status: 500 });
  }
}

// ============================================
// PATCH /api/events/[eventId]/coupons/[id]
// ============================================
// Atualiza um cupom

async function updateCoupon(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId, id } = await params;
    const body = await request.json();

    // Verificar se evento existe e pertence ao usuário
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para editar este evento' },
        { status: 403 }
      );
    }

    // Verificar se cupom existe
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        id,
        eventId,
      },
    });

    if (!existingCoupon) {
      return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 });
    }

    // Validar dados
    const validatedData = updateCouponSchema.parse(body);

    // Verificar se código foi alterado e se já existe
    if (validatedData.code && validatedData.code !== existingCoupon.code) {
      const codeExists = await prisma.coupon.findFirst({
        where: {
          eventId,
          code: validatedData.code,
          id: { not: id },
        },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: 'Já existe um cupom com este código para este evento' },
          { status: 409 }
        );
      }
    }

    // Preparar dados de atualização
    const updateData: Prisma.CouponUpdateInput = {};

    if (validatedData.code !== undefined) updateData.code = validatedData.code;
    if (validatedData.discountType !== undefined) updateData.discountType = validatedData.discountType;
    if (validatedData.discountValue !== undefined) {
      updateData.discountValue = validatedData.discountValue === null
        ? null
        : new Prisma.Decimal(validatedData.discountValue);
    }
    if (validatedData.startDate !== undefined) {
      updateData.startDate = validatedData.startDate === null ? null : new Date(validatedData.startDate as any);
    }
    if (validatedData.endDate !== undefined) {
      updateData.endDate = validatedData.endDate === null ? null : new Date(validatedData.endDate as any);
    }
    if (validatedData.maxUses !== undefined) updateData.maxUses = validatedData.maxUses;
    if (validatedData.modalityIds !== undefined) updateData.modalityIds = validatedData.modalityIds;
    if (validatedData.minPurchase !== undefined) {
      updateData.minPurchase = validatedData.minPurchase === null
        ? null
        : new Prisma.Decimal(validatedData.minPurchase);
    }
    if (validatedData.active !== undefined) updateData.active = validatedData.active;

    // Atualizar cupom
    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(coupon);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update coupon error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar cupom' }, { status: 500 });
  }
}

// ============================================
// DELETE /api/events/[eventId]/coupons/[id]
// ============================================
// Deleta um cupom

async function deleteCoupon(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId, id } = await params;

    // Verificar se evento existe e pertence ao usuário
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para deletar cupons deste evento' },
        { status: 403 }
      );
    }

    // Verificar se cupom existe
    const coupon = await prisma.coupon.findFirst({
      where: {
        id,
        eventId,
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 });
    }

    // Deletar cupom
    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Cupom deletado com sucesso' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return NextResponse.json({ error: 'Erro ao deletar cupom' }, { status: 500 });
  }
}

export const GET = withAuth(getCoupon);
export const PATCH = withAuth(updateCoupon);
export const DELETE = withAuth(deleteCoupon);
