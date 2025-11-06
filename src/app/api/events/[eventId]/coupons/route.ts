import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import prisma from '@/lib/db';
import { createCouponSchema } from '@/lib/validations/modality';
import { ZodError } from 'zod';

async function createCoupon(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId } = await params;
    const body = await request.json();

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== userId) {
      return NextResponse.json({ error: 'Evento não encontrado ou sem permissão' }, { status: 404 });
    }

    const validatedData = createCouponSchema.parse({ ...body, eventId });

    // Verificar se código já existe no evento
    const existing = await prisma.coupon.findFirst({
      where: { eventId, code: validatedData.code },
    });

    if (existing) {
      return NextResponse.json({ error: 'Código de cupom já existe neste evento' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        eventId,
        code: validatedData.code,
        discountType: validatedData.discountType,
        discountValue: validatedData.discountValue,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        maxUses: validatedData.maxUses,
        modalityIds: validatedData.modalityIds,
        minPurchase: validatedData.minPurchase,
        active: validatedData.active,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }
    console.error('Create coupon error:', error);
    return NextResponse.json({ error: 'Erro ao criar cupom' }, { status: 500 });
  }
}

async function listCoupons(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== userId) {
      return NextResponse.json({ error: 'Evento não encontrado ou sem permissão' }, { status: 404 });
    }

    const coupons = await prisma.coupon.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('List coupons error:', error);
    return NextResponse.json({ error: 'Erro ao listar cupons' }, { status: 500 });
  }
}

export const POST = withAuth(createCoupon);
export const GET = withAuth(listCoupons);
