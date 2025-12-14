import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import prisma from '@/lib/db';
import { createCouponSchema, updateCouponSchema } from '@/lib/validations/coupon';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// ============================================
// POST /api/events/[eventId]/coupons
// ============================================
// Cria um novo cupom no evento

async function createCoupon(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId } = await params;
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
        { error: 'Você não tem permissão para adicionar cupons a este evento' },
        { status: 403 }
      );
    }

    // Validar dados
    const validatedData = createCouponSchema.parse(body);

    // Verificar se código já existe para este evento
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        eventId,
        code: validatedData.code,
      },
    });

    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Já existe um cupom com este código para este evento' },
        { status: 409 }
      );
    }

    // Criar cupom
    const coupon = await prisma.coupon.create({
      data: {
        event: { connect: { id: eventId } },
        code: validatedData.code,
        discountType: validatedData.discountType,
        discountValue: new Prisma.Decimal(validatedData.discountValue),
        startDate: new Date(validatedData.startDate as any),
        endDate: new Date(validatedData.endDate as any),
        maxUses: validatedData.maxUses,
        modalityIds: validatedData.modalityIds || [],
        minPurchase: validatedData.minPurchase ? new Prisma.Decimal(validatedData.minPurchase) : null,
        active: validatedData.active,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create coupon error:', error);
    return NextResponse.json({ error: 'Erro ao criar cupom' }, { status: 500 });
  }
}

// ============================================
// GET /api/events/[eventId]/coupons
// ============================================
// Lista cupons do evento

async function listCoupons(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId } = await params;

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

    // Buscar cupons
    const coupons = await prisma.coupon.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error('List coupons error:', error);
    return NextResponse.json({ error: 'Erro ao listar cupons' }, { status: 500 });
  }
}

export const POST = withAuth(createCoupon);
export const GET = withAuth(listCoupons);
